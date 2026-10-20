import { EventEmitter } from 'events';
import { auditRepository } from '../repositories/auditRepository.js';

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
      // Non-blocking simulated transactional email/SMS dispatch
      console.log(`📧 [Job: sendOrderConfirmation] Sending confirmation for order: ${data.orderNumber} to ${data.customerEmail}`);
      // In production with SendGrid/AWS SES, real SDK call occurs here
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
  }

  registerHandler(jobName, handlerFn) {
    this.handlers.set(jobName, handlerFn);
  }

  /**
   * Enqueue background job (returns immediately, does not block request)
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
    setImmediate(() => this.processNext());
    return job.id;
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const job = this.queue.shift();
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
