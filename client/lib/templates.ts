import type { Collection } from "@/types";

export type CollectionTemplate = {
  key: string;
  name: string;
  emoji: string;
  tagline: string;
  defaults: Partial<Collection>;
};

export const COLLECTION_TEMPLATES: CollectionTemplate[] = [
  {
    key: "wedding",
    name: "Wedding",
    emoji: "💍",
    tagline: "Collect contributions for the happy couple",
    defaults: {
      collectionType: "wedding",
      description: "Join us in celebrating the union of two wonderful people. Every contribution is deeply appreciated.",
      suggestedAmount: 50000,
      minimumAmount: 10000,
      allowCustomAmount: true,
      visibility: "public",
      paymentPurpose: "Wedding contribution",
      thankYouMessage: "Thank you so much for your generous gift — it truly means the world to the couple!"
    }
  },
  {
    key: "birthday",
    name: "Birthday",
    emoji: "🎂",
    tagline: "Pool gifts for a special birthday",
    defaults: {
      collectionType: "birthday",
      description: "Help us celebrate this special birthday with a meaningful group gift.",
      suggestedAmount: 20000,
      minimumAmount: 5000,
      allowCustomAmount: true,
      visibility: "public",
      paymentPurpose: "Birthday gift contribution",
      thankYouMessage: "Thank you for making this birthday extra special! Your generosity is so appreciated."
    }
  },
  {
    key: "charity",
    name: "Charity",
    emoji: "❤️",
    tagline: "Raise funds for a cause you care about",
    defaults: {
      collectionType: "charity",
      description: "Every contribution, big or small, makes a real difference. Thank you for your support.",
      suggestedAmount: 10000,
      minimumAmount: 1000,
      allowCustomAmount: true,
      visibility: "public",
      paymentPurpose: "Charitable donation",
      thankYouMessage: "Your generosity is making a real impact. Thank you from the bottom of our hearts."
    }
  },
  {
    key: "emergency",
    name: "Emergency",
    emoji: "🚨",
    tagline: "Urgent help needed — every bit counts",
    defaults: {
      collectionType: "emergency",
      description: "We are going through a difficult time and need your support urgently. Any amount helps.",
      suggestedAmount: 50000,
      allowCustomAmount: true,
      visibility: "public",
      paymentPurpose: "Emergency support",
      thankYouMessage: "We cannot thank you enough. Your support during this difficult time means everything to us."
    }
  },
  {
    key: "church",
    name: "Church / Harambee",
    emoji: "⛪",
    tagline: "Community fundraising made easy",
    defaults: {
      collectionType: "church",
      description: "Join us in coming together for this important community cause. Your contribution is a blessing.",
      suggestedAmount: 10000,
      minimumAmount: 2000,
      allowCustomAmount: true,
      visibility: "public",
      paymentPurpose: "Community harambee contribution",
      thankYouMessage: "Mungu akubariki! Thank you for your generous contribution to our community."
    }
  },
  {
    key: "school",
    name: "School / Class",
    emoji: "🎓",
    tagline: "Class trips, uniforms, and school events",
    defaults: {
      collectionType: "school",
      description: "Help fund this important school activity. Contributions go directly toward our students.",
      suggestedAmount: 30000,
      minimumAmount: 5000,
      allowCustomAmount: true,
      visibility: "private",
      paymentPurpose: "School contribution",
      thankYouMessage: "Thank you for investing in our students' future. Your support is greatly appreciated."
    }
  },
  {
    key: "business",
    name: "Business",
    emoji: "💼",
    tagline: "Collect deposits, fees, or payments",
    defaults: {
      collectionType: "business",
      description: "Secure, fast payment collection for your business.",
      suggestedAmount: 100000,
      allowCustomAmount: true,
      visibility: "public",
      paymentPurpose: "Business payment",
      thankYouMessage: "Thank you for your payment. We appreciate your business!"
    }
  },
  {
    key: "trip",
    name: "Trip / Travel",
    emoji: "✈️",
    tagline: "Collect contributions for group travel",
    defaults: {
      collectionType: "trip",
      description: "We're planning an exciting trip and need everyone's contribution. Join us on this adventure!",
      suggestedAmount: 100000,
      minimumAmount: 50000,
      allowCustomAmount: false,
      visibility: "private",
      paymentPurpose: "Travel contribution",
      thankYouMessage: "You're all set! Your contribution has been received. We can't wait to travel together."
    }
  },
  {
    key: "custom",
    name: "Start from blank",
    emoji: "✏️",
    tagline: "Build your own collection from scratch",
    defaults: {
      collectionType: "custom",
      allowCustomAmount: true,
      visibility: "public"
    }
  }
];
