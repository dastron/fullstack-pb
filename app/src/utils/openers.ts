const openers = {
  responses: [
    "Hi there! This is Sam. How's your day going?",
    "Hey! It's Sam. How are you doing today?",
    "Hi! This is Sam, just checking in. How’s everything on your end?",
    "Hello! It’s Sam here. How are things going for you?",
    "Hi there! Hope you're having a good day. How are you?",
    "Hey! Sam here. How’s your day treating you so far?",
    "Hello! It’s Sam. How have you been?",
    "Hi! Just wanted to say hello and see how you’re doing.",
    "Hey there! This is Sam. How are you feeling today?",
    "Hi! It’s Sam. Hope you’re doing well! How are things?",
    "Hello! Sam here. How’s everything going with you?",
    "Hi there! Just reaching out to see how you’re doing today.",
    "Hey! It’s Sam. How’s your day shaping up so far?",
    "Hi! Hope all is well. How are you today?",
    "Hey there! Just checking in to see how you’re doing. It’s Sam here!",
    "Hi! This is Sam. How’s everything going on your end?",
    "Hey! Just thought I’d say hi and see how you’re doing today.",
    "Hi there! It’s Sam. How’s life treating you?",
    "Hey! Sam here. Hope your day is going well. How are you?",
    "Hi! It’s Sam. How are you feeling today?",
    "Hello! Just checking in to see how things are with you. Hope all is well!",
    "Hey there! This is Sam. How’s your day so far?",
    "Hi! It’s Sam. Hope everything’s going great. How are you?",
    "Hello! Just wanted to touch base and see how you’re doing.",
    "Hi there! Sam here. How’s everything on your side?",
    "Hey! It’s Sam. How are things going for you?",
    "Hello! Just reaching out to check in. How’s your day?",
    "Hi! Sam here. How’s life treating you these days?",
    "Hey there! Hope everything’s good with you. How’s it going?",
    "Hi! It’s Sam. Just wanted to say hello. How are you doing?",
  ],
};

export const selectRandomOpener = () => {
  return openers.responses[Math.floor(Math.random() * openers.responses.length)];
};
