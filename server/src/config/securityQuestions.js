const SECURITY_QUESTIONS = [
    'What was the name of your first school?',
    "What is your mother's maiden name?",
    'What was the name of your first pet?',
    'What was your childhood nickname?',
    'In which city were you born?',
    'What was the make of your first car?',
    'What is the name of the town where you grew up?',
    'What is your favorite book?'
];

function isValidSecurityQuestion(question) {
    return SECURITY_QUESTIONS.includes(String(question || '').trim());
}

module.exports = { SECURITY_QUESTIONS, isValidSecurityQuestion };
