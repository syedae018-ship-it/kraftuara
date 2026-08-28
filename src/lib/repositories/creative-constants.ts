import { CreativeService } from "@/types/creative";

export const initialServices: CreativeService[] = [
  {
    id: "serv-01",
    title: "Premium Logo Design",
    description: "Get a professional, custom logo design for your brand. Includes source files and 3 revisions.",
    startingPrice: 15000, // ₹15,000
    category: "Graphic Design",
    deliveryTime: "5 days",
    iconName: "PenTool",
    features: ["3 Concepts", "High-res files", "Vector files included"],
    coverImage: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "serv-02",
    title: "Store Setup & Configuration",
    description: "Complete setup of your catalog store including theme configuration and initial product upload.",
    startingPrice: 30000,
    category: "Design",
    deliveryTime: "3 days",
    iconName: "Monitor",
    features: ["Theme setup", "Up to 50 products", "Domain connection"],
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "serv-03",
    title: "Product Photography Package",
    description: "Professional product photography for up to 10 items. White background and lifestyle shots.",
    startingPrice: 45000,
    category: "Branding",
    deliveryTime: "7 days",
    iconName: "Camera",
    features: ["10 Products", "3 angles per product", "Retouching included"],
    coverImage: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800",
  },
];
