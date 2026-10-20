import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import { auditRepository } from '../repositories/auditRepository.js';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const queueStorePath = path.resolve(config.dataDir || path.resolve(__dirname, '../../data'), 'pending-jobs.json');

class JobQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.isProcessing = false;
    this.completedJobs = 0;
    this.failedJobs = 0;
    this.handlers = new Map();

    // Register default job handlers
    this.registerHandler('sendOrderConfirmation', async (data) => {
      console.log(`📧 [Job: sendOrderConfirmation] Sending confirmation for order: ${data.orderNumber} to ${data.customerEmail}`);
      return { sent: true, orderNumber: data.orderNumber };
    });

    this.registerHandler('sendInquiryNotification', async (data) => {
      console.log(`💌 [Job: sendInquiryNotification] Alerting bridal couture team for inquiry from ${data.email}`);
      return { notified: true, inquiryId: data.id };
    });

    this.registerHandler('recordAuditLog', async (data) => {
      await auditRepository.log(data);
      return { recorded: true };
    });

    // Recover durable pending jobs from disk on boot
    this.loadDurableQueue();
  }

  loadDurableQueue() {
    try {
      if (fs.existsSync(queueStorePath)) {
        const raw = fs.readFileSync(queueStorePath, 'utf8');
        const saved = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length > 0) {
          this.queue.push(...saved);
          console.log(`📦 [JobQueue] Recovered ${saved.length} durable pending job(s) from disk storage.`);
          setImmediate(() => this.processNext());
        }
      }
    } catch (err) {
      console.warn('⚠️ [JobQueue] Could not load durable queue state:', err.message);
    }
  }

  persistQueueSync() {
    try {
      const dir = path.dirname(queueStorePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(queueStorePath, JSON.stringify(this.queue, null, 2), 'utf8');
    } catch (err) {
      // Non-blocking log
    }
  }

  registerHandler(jobName, handlerFn) {
    this.handlers.set(jobName, handlerFn);
  }

  /**
   * Enqueue background job (durable, returns immediately)
   */
  enqueue(jobName, data, options = {}) {
    const job = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: jobName,
      data,
      retries: options.retries !== undefined ? options.retries : 3,
      backoffMs: options.backoffMs || 1000,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    this.queue.push(job);
    this.persistQueueSync();
    setImmediate(() => this.processNext());
    return job.id;
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const job = this.queue.shift();
    this.persistQueueSync();
    const handler = this.handlers.get(job.name);

    if (!handler) {
      console.error(`⚠️ [JobQueue] No handler registered for job: '${job.name}'`);
      this.failedJobs++;
      this.isProcessing = false;
      return this.processNext();
    }

    try {
      job.attempts++;
      await handler(job.data);
      this.completedJobs++;
      this.emit('jobCompleted', job);
    } catch (err) {
      console.error(`💥 [JobQueue] Job ${job.name} (attempt ${job.attempts}/${job.retries}) failed:`, err.message);

      if (job.attempts < job.retries) {
        const delay = job.backoffMs * Math.pow(2, job.attempts - 1);
        setTimeout(() => {
          this.queue.push(job);
          this.persistQueueSync();
          this.processNext();
        }, delay);
      } else {
        this.failedJobs++;
        this.emit('jobFailed', { job, error: err.message });
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }

  async flush(timeoutMs = 5000) {
    const start = Date.now();
    while ((this.queue.length > 0 || this.isProcessing) && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  stats() {
    return {
      pending: this.queue.length,
      completed: this.completedJobs,
      failed: this.failedJobs,
      handlers: Array.from(this.handlers.keys()),
    };
  }
}

export const jobQueue = new JobQueue();
