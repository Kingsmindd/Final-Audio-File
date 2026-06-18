// Seeds the database with initial product data.
// Run with: npm run seed

// This script"
// 1. connects to mongodb
// 2. Deletes all existing products
// 3. Inserts the sample products
// 4. Creates an admin user (if one doesnt exist)

import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product";
import User from "../models/User";
import dns from "dns";

// Load environment variable from .env file
dotenv.config();

dns.setServers(["8.8.8.8", "8.8.4.4"]);

// --- Product Data----
// This is the initial set of 6 products API on the website
const products = [
  {
    name: "XX99 Mark II Headphones",
    category: "headphones" as const,
    price: 3898700,
    image:
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781691719/XX99_Mark_II_headphones_oc9a10.png",
    description:
      "The new XX99 Mark II headphones is the pinnacle of pristine audio. It redefines your premium headphone experience by reproducing the balanced depth and precision of studio-quality sound.",
    features:
      "Featuring a genuine leather head strap and premium earcups, these headphones deliver superior comfort for those who like to enjoy endless listening. It includes intuitive controls designed for any situation. Whether you’re taking a business call or just in your own personal space, the auto on/off and pause features ensure that you’ll never miss a beat. \n\n\n\nThe advanced Active Noise Cancellation with built-in equalizer allow you to experience your audio world on your terms. It lets you enjoy your audio in peace, but quickly interact with your surroundings when you need to. Combined with Bluetooth 5. 0 compliant connectivity and 17 hour battery life, the XX99 Mark II headphones gives you superior sound, cutting-edge technology, and a modern design aesthetic.",
    inTheBox: [
      {
        quantity: 1,
        item: "Headphone Unit",
      },
      {
        quantity: 2,
        item: "Replacement Earcup",
      },
      {
        quantity: 1,
        item: "User manual",
      },
      { quantity: 1, item: "3.5mm 5m Audio Cable" },
      { quantity: 1, item: "Travel Bag" },
    ],
    gallery: [
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781693286/XX99_Mark_II_headphones_1st_Photo_yfpedh.png",
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781693293/XX99_Mark_II_headphones_2nd_Photo_uws54j.png",
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781693304/XX99_Mark_II_headphones_3rd_Photo_qrh7az.png",
    ],

    isNewArrival: true,
  },

  {
    name: "XX99 Mark I Headphones",
    category: "headphones" as const,
    price: 2275000,
    image:
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781692264/XX99_Mark_I_headphones_gcozde.png  ",
    description:
      "As the gold standard for headphones, the classic XX99 Mark I offers detailed and accurate audio reproduction for audiophiles, mixing engineers, and music aficionados alike in studios and on the go.",
    features:
      "As the headphones all others are measured against, the XX99 Mark I demonstrates over five decades of audio expertise, redefining the critical listening experience. This pair of closed-back headphones are made of industrial, aerospace-grade materials to emphasize durability at a relatively light weight of 11 oz.\n\n\n\n From the handcrafted microfiber ear cushions to the robust metal headband with inner damping element, the components work together to deliver comfort and uncompromising sound. Its closed-back design delivers up to 27 dB of passive noise cancellation, reducing resonance by reflecting sound to a dedicated absorber. For connectivity, a specially tuned cable is included with a balanced gold connector.",
    inTheBox: [
      {
        quantity: 1,
        item: "Headphone Unit",
      },
      {
        quantity: 2,
        item: "Replacement Earcup",
      },
      {
        quantity: 1,
        item: "User manual",
      },
      { quantity: 1, item: "3.5mm 5m Audio Cable" },
    ],
    gallery: [
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781693900/XX99_Mark_I_headphones_1st_Photo_dhokji.png",
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781693910/XX99_Mark_I_headphones_2nd_Photo_l0pwkb.png",
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781693921/XX99_Mark_I_headphones_3rd_Photo_vmocwd.png",
    ],

    isNewArrival: false,
  },

  {
    name: "XX59 Headphones",
    category: "headphones" as const,
    price: 1168700,
    image:
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781692277/XX59_headphones_r5stmo.png",
    description:
      "Enjoy your audio almost anywhere and customize it to your specific tastes with the XX59 headphones. The stylish yet durable versatile wireless headset is a brilliant companion at home or on the move.",
    features:
      "These headphones have been created from durable, high-quality materials tough enough to take anywhere. Its compact folding design fuses comfort and minimalist style making it perfect for travel. Flawless transmission is assured by the latest wireless technology engineered for audio synchronization with videos. \n\n\n\nMore than a simple pair of headphones, this headset features a pair of built-in microphones for clear, hands-free calling when paired with a compatible smartphone. Controlling music and calls is also intuitive thanks to easy-access touch buttons on the earcups. Regardless of how you use the XX59 headphones, you can do so all day thanks to an impressive 30-hour battery life that can be rapidly recharged via USB-C.",
    inTheBox: [
      {
        quantity: 1,
        item: "Headphone Unit",
      },
      {
        quantity: 2,
        item: "Replacement Earcup",
      },
      {
        quantity: 1,
        item: "User manual",
      },
      { quantity: 1, item: "3.5mm 5m Audio Cable" },
    ],
    gallery: [
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781694349/XX59_headphones_1st_Photo_br7a7r.png",
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781694349/XX59_headphones_2nd_Photo_a7hjhz.png",
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781694348/XX59_headphones_3rd_Photo_z92vbk.png",
    ],

    isNewArrival: false,
  },

  {
    name: "ZX9 SPEAKER",
    category: "speakers" as const,
    price: 5850000,
    image:
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781692285/ZX9_speaker_vhirxv.png",
    description:
      "Upgrade your sound system with the all new ZX9 active speaker. It’s a bookshelf speaker system that offers truly wireless connectivity -- creating new possibilities for more pleasing and practical audio setups.",
    features:
      "Connect via Bluetooth or nearly any wired source. This speaker features optical, digital coaxial, USB Type-B, stereo RCA, and stereo XLR inputs, allowing you to have up to five wired source devices connected for easy switching. Improved bluetooth technology offers near lossless audio quality at up to 328ft (100m).\n\n\n\nDiscover clear, more natural sounding highs than the competition with ZX9’s signature planar diaphragm tweeter. Equally important is its powerful room-shaking bass courtesy of a 6.5” aluminum alloy bass unit. You’ll be able to enjoy equal sound quality whether in a large room or small den. Furthermore, you will experience new sensations from old songs since it can respond to even the subtle waveforms.",
    inTheBox: [
      {
        quantity: 2,
        item: "Speaker Unit",
      },
      {
        quantity: 2,
        item: "Speaker Cloth Panel",
      },
      {
        quantity: 1,
        item: "User manual",
      },
      { quantity: 1, item: "3.5mm 10m Audio Cable" },
      { quantity: 1, item: "10m Optical Cable" },
    ],
    gallery: [
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781694701/ZX9_speaker_1st_Photo_tuilhr.png",
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781694714/ZX9_speaker_2nd_Photo_xcb3y8.png",
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781694722/ZX9_speaker_3rd_Photo_kbknfw.png",
    ],

    isNewArrival: true,
  },

  {
    name: "ZX7 SPEAKER",
    category: "speakers" as const,
    price: 4550000,
    image:
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781692306/ZX7_speaker_sm3q3y.png",
    description:
      "Stream high quality sound wirelessly with minimal to no loss. The ZX7 speaker uses high-end audiophile components that represents the top of the line powered speakers for home or studio use.",
    features:
      "Reap the advantages of a flat diaphragm tweeter cone. This provides a fast response rate and excellent high frequencies that lower tiered bookshelf speakers cannot provide. The woofers are made from aluminum that produces a unique and clear sound. XLR inputs allow you to connect to a mixer for more advanced usage.\n\n\n\nThe ZX7 speaker is the perfect blend of stylish design and high performance. It houses an encased MDF wooden enclosure which minimises acoustic resonance. Dual connectivity allows pairing through bluetooth or traditional optical and RCA input. Switch input sources and control volume at your finger tips with the included wireless remote. This versatile speaker is equipped to deliver an authentic listening experience.",
    inTheBox: [
      {
        quantity: 2,
        item: "Speaker Unit",
      },
      {
        quantity: 2,
        item: "Speaker Cloth Panel",
      },
      {
        quantity: 1,
        item: "User manual",
      },
      { quantity: 1, item: "3.5mm 7.5m Audio Cable" },
      { quantity: 1, item: "7.5m Optical Cable" },
    ],
    gallery: [
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781694887/ZX7_speaker_1st_Photo_fwr25k.png",
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781694895/ZX7_speaker_2nd_Photo_ll2pcj.png",
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781694903/ZX7_speaker_3rd_Photo_yej8xv.png",
    ],

    isNewArrival: false,
  },

  {
    name: "YX1 WIRELESS EARPHONES",
    category: "earphones" as const,
    price: 778700,
    image:
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781692342/YX1_wireless_earphones_opwfgn.png ",
    description:
      "Tailor your listening experience with bespoke dynamic drivers from the new YX1 Wireless Earphones. Enjoy incredible high-fidelity sound even in noisy environments with its active noise cancellation feature.",
    features:
      "Experience unrivalled stereo sound thanks to innovative acoustic technology. With improved ergonomics designed for full day wearing, these revolutionary earphones have been finely crafted to provide you with the perfect fit, delivering complete comfort all day long while enjoying exceptional noise isolation and truly immersive sound.\n\n\n\nThe YX1 Wireless Earphones features customizable controls for volume, music, calls, and voice assistants built into both earbuds. The new 7-hour battery life can be extended up to 28 hours with the charging case, giving you uninterrupted play time. Exquisite craftsmanship with a splash resistant design now available in an all new white and grey color scheme as well as the popular classic black.",
    inTheBox: [
      {
        quantity: 2,
        item: "Earphone Unit",
      },
      {
        quantity: 6,
        item: "Multi-size Earplugs",
      },
      {
        quantity: 1,
        item: "User manual",
      },
      { quantity: 1, item: "USB-C Charging Cable" },
      { quantity: 1, item: "Travel Pouch" },
    ],
    gallery: [
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781695284/YX1_wireless_speaker_1st_Photo_wp5pbo.png",
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781695292/YX1_wireless_speaker_2nd_Photo_b5h5f9.png",
      "https://res.cloudinary.com/drdr9gib1/image/upload/v1781695300/YX1_wireless_speaker_3rd_Photo_qurup2.png",
    ],

    isNewArrival: true,
  },
];

// ----- seed function -----
const seedDatabase = async (): Promise<void> => {
  try {
    // connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ connected to MongoDB fro seeding");

    //Remove all existing products (start fresh)
    await Product.deleteMany({});
    console.log("🗑️ Cleared existing products or clear the space");

    //Insert all products
    await Product.insertMany(products);
    console.log(`⭐ Inserted ${products.length} products`);

    // Create an admin user if one dosent exist
    const adminExists = await User.findOne({ email: "admin@audiophile.com" });

    if (!adminExists) {
      await User.create({
        name: "Admin",
        email: "admin@audiophile.com",
        password: "admin123",
        isAdmin: true,
      });
      console.log("⛑️ Admin user created : admin@audiphile.com / admin123");
    } else {
      console.log("‼️ ⁉️ Amin user already exists");
    }
    console.log("\n 🎉 Database seeded succesfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1); //Exit with error
  }
};

//Run the seed function
seedDatabase();
