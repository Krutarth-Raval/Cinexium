import nodemailer from 'nodemailer';

async function test() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ravalkrutarth95@gmail.com',
      pass: 'rgdd mfub yook iyoj',
    },
  });

  try {
    await transporter.verify();
    console.log("Credentials work!");
  } catch (error) {
    console.error("Credentials failed:", error);
  }
}

test();
