// 💬 Smart Replies — keyword based, completely free
export const getSmartReplies = (message) => {
    const msg = message.toLowerCase();

    if (msg.includes("how are you") || msg.includes("how r u") || msg.includes("wassup") || msg.includes("sup"))
        return ["I'm good, thanks!", "Doing great 😊", "All good! You?"];

    if (msg.includes("?"))
        return ["Yes!", "No, sorry", "Let me check 🤔"];

    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("hii"))
        return ["Hey! 👋", "Hello!", "Hi there 😊"];

    if (msg.includes("thanks") || msg.includes("thank you") || msg.includes("ty"))
        return ["You're welcome!", "No problem 😊", "Anytime!"];

    if (msg.includes("ok") || msg.includes("okay") || msg.includes("sure") || msg.includes("alright"))
        return ["Great!", "Sounds good 👍", "Perfect!"];

    if (msg.includes("bye") || msg.includes("goodbye") || msg.includes("gn") || msg.includes("good night"))
        return ["Bye! 👋", "Good night! 🌙", "Take care!"];

    if (msg.includes("love") || msg.includes("❤") || msg.includes("miss"))
        return ["❤️", "Miss you too!", "Aww 😊"];

    if (msg.includes("lol") || msg.includes("haha") || msg.includes("😂"))
        return ["😂😂", "Haha ikr!", "So funny 😄"];

    if (msg.includes("meet") || msg.includes("coming") || msg.includes("when"))
        return ["Sure, when?", "I'll be there!", "Can't make it 😕"];

    if (msg.includes("food") || msg.includes("eat") || msg.includes("hungry"))
        return ["I'm hungry too!", "Let's order 🍕", "What do you want?"];

    // Default
    return ["👍", "Got it!", "Okay 😊"];
};

// 🌍 Translator — MyMemory free API (no key needed)
export const translateMessage = async (message, targetLanguage) => {
    const langCodes = {
        'Hindi': 'hi', 'Spanish': 'es', 'French': 'fr',
        'Arabic': 'ar', 'Japanese': 'ja', 'German': 'de',
        'Chinese': 'zh', 'Portuguese': 'pt', 'Russian': 'ru',
        'Italian': 'it'
    };
    const langCode = langCodes[targetLanguage] || 'hi';
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(message)}&langpair=en|${langCode}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.responseData.translatedText;
};