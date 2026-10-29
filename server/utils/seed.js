import 'dotenv/config';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import User from '../models/User.js';
import { Testimonial, Coupon } from '../models/Misc.js';

const TREE = {
  'Gold Jewellery': ['Gold Rings', 'Gold Necklaces', 'Gold Chains', 'Gold Earrings', 'Gold Bangles', 'Gold Bracelets', 'Gold Pendants', 'Gold Mangalsutra', 'Gold Anklets', 'Gold Nose Pins', 'Gold Wedding Jewellery'],
  'Diamond Jewellery': ['Diamond Rings', 'Diamond Earrings', 'Diamond Necklaces', 'Diamond Pendants', 'Diamond Bracelets', 'Diamond Bangles', 'Diamond Wedding Sets', 'Diamond Engagement Rings'],
  'Silver Jewellery': ['Silver Rings', 'Silver Chains', 'Silver Earrings', 'Silver Anklets', 'Silver Bracelets', 'Silver Bangles', 'Silver Necklaces', 'Silver Toe Rings', 'Silver Pendants'],
  'Bridal Jewellery': ['Bridal Necklace Sets', 'Bridal Earrings', 'Bridal Bangles', 'Bridal Maang Tikka', 'Bridal Matha Patti', 'Bridal Nath', 'Bridal Kundan Sets', 'Bridal Polki Sets', 'Bridal Temple Jewellery'],
  'Traditional and Ethnic Jewellery': ['Kundan Jewellery', 'Polki Jewellery', 'Meenakari Jewellery', 'Temple Jewellery', 'Antique Jewellery', 'Jadau Jewellery', 'Oxidised Jewellery', 'Navratna Jewellery'],
  'Fashion and Imitation Jewellery': ['Artificial Earrings', 'Fashion Necklaces', 'Statement Rings', 'Fashion Bangles', 'Layered Chains', 'Chokers', 'Party-Wear Jewellery', 'Lightweight Daily-Wear Jewellery'],
  'Gemstone Jewellery': ['Ruby Jewellery', 'Emerald Jewellery', 'Sapphire Jewellery', 'Pearl Jewellery', 'Birthstone Jewellery', 'Gemstone Rings', 'Gemstone Pendants'],
  "Men's Jewellery": ["Men's Gold Chains", "Men's Rings", "Men's Bracelets", "Men's Kada", "Men's Earrings", "Men's Pendants", 'Cufflinks'],
  'Jewellery for Kids': ["Kids' Earrings", "Kids' Bracelets", "Kids' Pendants", "Kids' Rings", "Kids' Anklets"],
  'Wedding and Occasion Collections': ['Engagement Jewellery', 'Wedding Jewellery', 'Anniversary Gifts', 'Festive Jewellery', 'Birthday Gifts', "Valentine's Day Gifts", 'Everyday Essentials', 'Luxury Collections'],
};

await mongoose.connect(process.env.MONGO_URI);

if (!(await Category.countDocuments())) {
  let po = 0;
  for (const [parentName, kids] of Object.entries(TREE)) {
    const parent = await Category.create({ name: parentName, order: po++ });
    let co = 0;
    for (const k of kids) await Category.create({ name: k, parent: parent._id, order: co++ });
  }
  console.log('Categories seeded');
} else console.log('Categories already exist, skipped');

if (!(await User.findOne({ role: 'admin' }))) {
  await User.create({ name: 'Admin', email: process.env.ADMIN_EMAIL || 'admin@jewels.com', password: process.env.ADMIN_PASSWORD || 'Admin@12345', role: 'admin' });
  console.log('Admin user created');
}
if (!(await Coupon.countDocuments())) {
  await Coupon.create({ code: 'WELCOME10', type: 'percent', value: 10, minOrder: 5000, maxDiscount: 5000 });
  console.log('Sample coupon WELCOME10 created');
}
if (!(await Testimonial.countDocuments())) {
  await Testimonial.insertMany([
    { name: 'Priya S.', city: 'Ahmedabad', text: 'The craftsmanship on my bridal set was breathtaking. Every detail was perfect.' },
    { name: 'Rahul M.', city: 'Mumbai', text: 'Delivery was fast and insured. The diamond ring looks even better in person.' },
    { name: 'Anjali K.', city: 'Surat', text: 'Beautiful designs, transparent pricing and great support throughout.' },
  ]);
}
await mongoose.disconnect();
console.log('Done');
