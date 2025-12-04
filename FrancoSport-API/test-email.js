import { transporter } from './src/config/email.js';

console.log('Testing SMTP connection...');

if (!transporter) {
  console.error('❌ Transporter not initialized. Check your .env variables.');
  process.exit(1);
}

transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Connection failed:');
    console.error(error);
    process.exit(1);
  } else {
    console.log('✅ Server is ready to take our messages');
    process.exit(0);
  }
});
