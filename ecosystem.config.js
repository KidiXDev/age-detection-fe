module.exports = {
  apps: [
    {
      name: "age-detection",
      script: "npm",
      args: "run start",
      env: {
        PORT: 7070,
        NODE_ENV: "production",
        PYTHON_API_URL: "http://localhost:6969/api/detect-age",
      },
      env_production: {
        PORT: 7070,
        NODE_ENV: "production",
        PYTHON_API_URL: "http://localhost:6969/api/detect-age",
      },
    },
  ],
};
