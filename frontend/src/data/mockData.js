export const mockShops = [
  {
    id: 1,
    user_id: 101, // Vendor ID
    shop_name: "Green Valley Mart",
    address: "123 Main St, New Delhi",
    latitude: 28.6139,
    longitude: 77.2090,
    is_active: true,
    rating: 4.8,
    delivery_time: "15 min",
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&q=80",
    tags: ["Groceries", "Fresh Produce"]
  },
  {
    id: 2,
    user_id: 102,
    shop_name: "TechHub Electronics",
    address: "45 Tech Park, New Delhi",
    latitude: 28.6200,
    longitude: 77.2100,
    is_active: true,
    rating: 4.5,
    delivery_time: "30 min",
    image: "https://images.unsplash.com/photo-1531297172864-fd875d4454d1?w=400&q=80",
    tags: ["Electronics", "Gadgets"]
  },
  {
    id: 3,
    user_id: 103,
    shop_name: "Morning Brew Café",
    address: "78 Coffee St, New Delhi",
    latitude: 28.6300,
    longitude: 77.2200,
    is_active: true,
    rating: 4.9,
    delivery_time: "10 min",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80",
    tags: ["Beverages", "Bakery"]
  }
];

export const mockProducts = [
  {
    id: 1,
    shop_id: 1,
    name: "Fresh Organic Apples",
    description: "Crisp and sweet organic apples sourced directly from local farms.",
    price: 4.99,
    stock: 50,
    image_path: "https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=400&q=80"
  },
  {
    id: 2,
    shop_id: 1,
    name: "Whole Wheat Bread",
    description: "Freshly baked whole wheat bread, perfect for healthy sandwiches.",
    price: 2.49,
    stock: 20,
    image_path: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80"
  },
  {
    id: 3,
    shop_id: 2,
    name: "Wireless Earbuds Pro",
    description: "Noise-cancelling wireless earbuds with 24-hour battery life.",
    price: 89.99,
    stock: 15,
    image_path: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80"
  },
  {
    id: 4,
    shop_id: 2,
    name: "Fast Charging Cable",
    description: "Durable braided fast charging cable (USB-C to USB-C).",
    price: 12.99,
    stock: 100,
    image_path: "https://images.unsplash.com/photo-1519558260268-cce7f548ea20?w=400&q=80"
  },
  {
    id: 5,
    shop_id: 3,
    name: "Premium Coffee Blend",
    description: "Signature dark roast coffee beans for the perfect morning cup.",
    price: 14.50,
    stock: 30,
    image_path: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=400&q=80"
  }
];
