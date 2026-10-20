/**
 * PM2 Ecosystem Configuration for 24/7 Continuous High-Availability
 *
 * Commands:
 *   npx pm2 start ecosystem.config.cjs        # Start 24/7
 *   npx pm2 stop ecosystem.config.cjs         # Stop
 *   npx pm2 restart ecosystem.config.cjs      # Zero-downtime reload
 *   npx pm2 logs                              # View live logs
 *   npx pm2 status                            # Check status & memory
 *   npx pm2 save                              # Save active process list
 *   npx pm2 startup                           # Auto-start on system reboot
 */
module.exports = {
  apps: [
    {
      name: 'shreeji-server',
      script: './src/server.js',
      instances: 'max', // Multi-core cluster mode for maximum throughput & 0 downtime
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      exp_backoff_restart_delay: 100, // Exponential backoff on crash loop
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
    },
  ],
};
