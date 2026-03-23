const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb+srv://abhinav2003singh16_db_user:IPA5D3H0PKyMSIVG@pathology.gihxkmm.mongodb.net/pathocare?appName=pathology');
  const db = mongoose.connection;
  
  const Booking = db.collection('bookings');
  const booking = await Booking.findOne({ barcode: "Sample_004" });
  console.log("BOOKING ID:", booking?._id);

  if (booking) {
    const Report = db.collection('reports');
    const report = await Report.findOne({ bookingId: booking._id });
    console.log("REPORT OBJECT:", JSON.stringify(report, null, 2));
  }
  
  process.exit(0);
}
run();
