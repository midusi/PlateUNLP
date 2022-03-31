module.exports = {
  apps: [{
    name: 'frontend',
    script: 'npm run dev',
    args: ['--name', 'frontend'],
    instances: '1',
    wait_ready: true
  },
  {
    name: 'backend',
    script: '../backend/gateway.wsgi',
    instances: '1',
    wait_ready: true,
    interpreter: 'python3'
  }
  ]
}
