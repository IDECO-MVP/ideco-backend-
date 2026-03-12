module.exports = {
  apps: [
    {
      name: "ideco-backend", // change this to your project name
      script: "dist/server.js",
      cwd: "/var/www/ideco-backend-",// must match your deployment directory on EC2
      instances: 1, // or "max" if you want PM2 to use all CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      node_args: "--expose-gc --max-old-space-size=2048",
      watch: false, // no file watching in production
      error_file: "/var/www/ideco-backend-/logs/error.log",
      out_file: "/var/www/ideco-backend-/logs/output.log",
      merge_logs: true,
      max_memory_restart: "2048M",
    },
  ],
};