/** Effects a user can select (max 3) in step 2 */
export const EFFECTS = [
  { id: "numb", label: "Numb", icon: "✦" },
  { id: "optimistic", label: "Optimistic", icon: "☺" },
  { id: "sedated", label: "Sedated", icon: "😴" },
  { id: "amused", label: "Amused", icon: "😄" },
  { id: "aroused", label: "Aroused", icon: "🔥" },
  { id: "chatty", label: "Chatty", icon: "💬" },
  { id: "chill", label: "Chill", icon: "😌" },
  { id: "couch-locked", label: "Couch-Locked", icon: "🛋" },
  { id: "creative", label: "Creative", icon: "🎨" },
  { id: "energised", label: "Energised", icon: "⚡" },
  { id: "euphoria", label: "Euphoria", icon: "✨" },
  { id: "floaty", label: "Floaty", icon: "☁" },
  { id: "focused", label: "Focused", icon: "🎯" },
  { id: "giggly", label: "Giggly", icon: "😂" },
  { id: "heavy", label: "Heavy", icon: "🏋" },
  { id: "hungry", label: "Hungry", icon: "🍽" },
  { id: "joyful", label: "Joyful", icon: "😊" },
  { id: "motivated", label: "Motivated", icon: "🏆" },
  { id: "sleepy", label: "Sleepy", icon: "💤" },
  { id: "tingly", label: "Tingly", icon: "✧" },
  { id: "trippy", label: "Trippy", icon: "🌀" },
] as const;

/** Medical conditions a user can select (max 3) in step 2 */
export const CONDITIONS = [
  { id: "pain", label: "Pain", icon: "💢" },
  { id: "anxiety", label: "Anxiety", icon: "😰" },
  { id: "insomnia", label: "Insomnia", icon: "🌙" },
  { id: "depression", label: "Depression", icon: "🌧" },
  { id: "nausea", label: "Nausea", icon: "🤢" },
  { id: "ptsd", label: "PTSD", icon: "🛡" },
  { id: "muscle-spasms", label: "Muscle Spasms", icon: "💪" },
  { id: "appetite-loss", label: "Appetite Loss", icon: "🍽" },
  { id: "inflammation", label: "Inflammation", icon: "🔴" },
  { id: "migraines", label: "Migraines", icon: "🤕" },
  { id: "adhd", label: "ADHD", icon: "🧠" },
  { id: "epilepsy", label: "Epilepsy", icon: "⚡" },
] as const;

/** How the product was consumed */
export const CONSUMPTION_METHODS = [
  { id: "flower", label: "Flower", icon: "🌿" },
  { id: "oil", label: "Oil", icon: "💧" },
  { id: "vape", label: "Vape", icon: "💨" },
  { id: "edible", label: "Edible", icon: "🍪" },
  { id: "tincture", label: "Tincture", icon: "🧪" },
  { id: "concentrate", label: "Concentrate", icon: "💎" },
] as const;
