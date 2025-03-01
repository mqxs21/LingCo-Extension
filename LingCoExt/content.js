(function () {
    const wordsAndDefinitions = [];
    let lastHighlightedButton = null;
    let observer = null;
    let typingTimeouts = [];
    let typeSpeed = 5;
    let isMinimized = false;
    let currentQuestionType = "mcq";

    // We'll define this variable so it can be accessed by autoClickStartEngine
    let autoSolveButton = null;

    function initializePopup() {
        const popup = document.createElement("div");
        popup.id = "answer-popup";
        popup.style.position = "fixed";
        popup.style.top = "6px";
        popup.style.right = "6px";
        popup.style.backgroundColor = "#fff";
        popup.style.border = "1px solid #ddd";
        popup.style.padding = "8px";
        popup.style.zIndex = 1000;
        popup.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
        popup.style.transition = "height 0.3s, width 0.3s";

        const toggleButton = document.createElement("button");
        toggleButton.innerText = "Minimize";
        toggleButton.style.marginBottom = "6px";
        toggleButton.onclick = () => {
            isMinimized = !isMinimized;
            if (isMinimized) {
                popup.style.height = "auto";
                popup.style.width = "60px";
                popup.style.overflow = "hidden";
                popup.innerHTML = "";
                popup.appendChild(toggleButton);
                toggleButton.innerText = "Expand";
            } else {
                popup.style.height = "";
                popup.style.width = "";
                popup.innerHTML = "";
                popup.appendChild(toggleButton);
                appendPopupContents(popup);
                toggleButton.innerText = "Close";
            }
        };

        popup.appendChild(toggleButton);
        appendPopupContents(popup);

        document.body.appendChild(popup);
    }

    function appendPopupContents(popup) {
        const startButton = document.createElement("button");
        startButton.innerText = "Get Words and Def";
        startButton.onclick = () => {
            getWordsAndDefinitions();
        };

        autoSolveButton = document.createElement("button");
        autoSolveButton.innerText = "Start Engine";
        autoSolveButton.style.marginLeft = "8px";
        autoSolveButton.onclick = () => {
            startAutoSolve();
        };

        const typeSpeedLabel = document.createElement("label");
        typeSpeedLabel.innerText = "Type Speed:";
        typeSpeedLabel.style.marginLeft = "5px";
        typeSpeedLabel.style.fontSize = "12px";

        const typeSpeedInput = document.createElement("input");
        typeSpeedInput.type = "number";
        typeSpeedInput.value = typeSpeed;
        typeSpeedInput.style.width = "60px";
        typeSpeedInput.style.fontSize = "12px";
        typeSpeedInput.style.marginLeft = "5px";
        typeSpeedInput.onchange = () => {
            typeSpeed = parseInt(typeSpeedInput.value);
        };

        popup.appendChild(startButton);
        popup.appendChild(autoSolveButton);
        popup.appendChild(typeSpeedLabel);
        popup.appendChild(typeSpeedInput);

        const audioLabel = document.createElement("label");
        audioLabel.innerText = "Null";

        const practiceQuestionButton = document.createElement("button");
        practiceQuestionButton.style.height = "auto";
        practiceQuestionButton.style.width = "60px";
        practiceQuestionButton.innerText = "get question";
        practiceQuestionButton.style.marginTop = "6px";
        practiceQuestionButton.onclick = () => {
            const practiceQuestionEle = document.querySelector(".flex-grow-1");
            let output = ""; // Variable to store the final output

            if (practiceQuestionEle) {
                const practiceQuestionText = practiceQuestionEle.innerText;
                console.log("Practice Question: ", practiceQuestionText);
                output += `Practice Question: ${practiceQuestionText}\n`;
            } else {
                console.log("Practice question element not found.");
                output += "Practice question element not found.\n";
            }

            // Select only the answer choice paragraphs (exclude question text)
            const answerChoices = document.querySelectorAll(".align-items-center p");
            if (answerChoices.length > 0) {
                console.log("Answer Choices:");
                output += "Answer Choices:\n";
                answerChoices.forEach((choice, index) => {
                    if (!choice.innerText.includes("______")) {
                        console.log(`${index + 1}: ${choice.innerText}`);
                        output += `${index + 1}: ${choice.innerText}\n`;
                    }
                });
            } else {
                console.log("No answer choices found.");
                output += "No answer choices found.\n";
            }

            const fillInTheBlankPrompt = document.querySelector(".fill-blanks-form p");
            if (fillInTheBlankPrompt) {
                output += "\nFill in the blank prompt: ";
                output += fillInTheBlankPrompt.innerText;
            }

            navigator.clipboard.writeText(output)
                .then(() => {
                    console.log("Output copied to clipboard.");
                })
                .catch(err => {
                    console.error("Error copying to clipboard: ", err);
                });
        };

        popup.appendChild(practiceQuestionButton);
    }

    function getWordsAndDefinitions() {
        wordsAndDefinitions.length = 0;

        const vocabElements = document.querySelectorAll(".vocab-set-term, .session-title");
        vocabElements.forEach(term => {
            const word = term.querySelector(".title, p")?.innerText.trim();
            const definition = term.querySelector(".definition")?.innerText.trim();

            if (word && definition) {
                wordsAndDefinitions.push({ word, definition });
            }
        });

        localStorage.setItem("wordsAndDefinitions", JSON.stringify(wordsAndDefinitions));
        alert(`Collected ${wordsAndDefinitions.length} words and definitions.`);
    }

    function solveQuestion() {
        const promptElement = document.querySelector(".session-title p");
        const answerButtons = document.querySelectorAll(".session-answer-choices button");

        const audioPrompt = document.querySelector(".session-audio-button-new");
        if (audioPrompt) {
            // We have an audio-based question
            currentQuestionType = "audio";
            answerButtons.forEach(button => {
                const answerText = button.innerText.trim().toLowerCase();
                const matchedEntry = wordsAndDefinitions.find(
                    item => item.definition.toLowerCase() === answerText
                );
                if (matchedEntry) {
                    const matchedWord = document.createElement("span");
                    matchedWord.innerText = ` (${matchedEntry.word})`;
                    button.appendChild(matchedWord);
                }
            });

            // Attempt auto-solve after matching
            autoSolveButton.click();
            setTimeout(() => {
                autoSolveButton.click();
            }, 500);

            // Append Spanish if we can match
            const potPrompt = document.querySelector(".session-title p");
            const promptSpanish = wordsAndDefinitions.find(
                item => item.definition === potPrompt.innerText.toLowerCase()
            );
            if (promptSpanish) {
                potPrompt.innerText = `${potPrompt.innerText} (${promptSpanish.word})`;
            }
        } else {
            // Non-audio-based question
            clearPreviousActions();

            const prompt = promptElement.innerText.trim();
            const forwardEntry = wordsAndDefinitions.find(item => item.word === prompt);
            const backwardEntry = wordsAndDefinitions.find(item => item.definition === prompt);

            let answerFound = false;

            if (forwardEntry) {
                answerFound = fillOrHighlightAnswer(forwardEntry.definition);
            }
            if (!answerFound && backwardEntry) {
                answerFound = fillOrHighlightAnswer(backwardEntry.word);
            }
            if (!answerFound) {
                console.warn("Correct answer not found among the choices.");
            }
        }
    }

    function fillOrHighlightAnswer(correctAnswer) {
        const answerButtons = document.querySelectorAll(".session-answer-choices button");
        let answerFound = false;

        answerButtons.forEach(button => {
            currentQuestionType = "mcq";
            const answerText = button.innerText.trim().toLowerCase();
            if (answerText === correctAnswer.toLowerCase()) {
                button.style.backgroundColor = "#28a745";
                button.style.color = "white";
                lastHighlightedButton = button;
                button.click();

                setTimeout(() => {
                    button.click(); // second click
                    const nextButton = document.querySelector(".button-next");
                    setTimeout(() => {
                        nextButton && nextButton.click();
                    }, 500);
                }, 500);

                answerFound = true;
            }
        });

        const inputBox = document.querySelector(".session-typing input");
        if (inputBox && inputBox.value !== correctAnswer) {
            currentQuestionType = "typing";
            simulateTyping(inputBox, correctAnswer);
            answerFound = true;
        }

        return answerFound;
    }

    function simulateTyping(inputElement, value) {
        clearTyping();

        // Optionally clear the input first
        if (value !== inputElement.value) {
            inputElement.value = "";
        }

        inputElement.focus();
        value.split("").forEach((char, index) => {
            const timeout = setTimeout(() => {
                inputElement.value += char;
                inputElement.dispatchEvent(new Event("input", { bubbles: true }));
            }, index * (100 / typeSpeed));
            typingTimeouts.push(timeout);
        });

        const finalTimeout = setTimeout(() => {
            inputElement.dispatchEvent(new Event("change", { bubbles: true }));
        }, value.length * (100 / typeSpeed) + 100);

        typingTimeouts.push(finalTimeout);
    }

    function clearTyping() {
        typingTimeouts.forEach(timeout => clearTimeout(timeout));
        typingTimeouts = [];
    }

    function clearPreviousActions() {
        if (lastHighlightedButton) {
            lastHighlightedButton.style.backgroundColor = "";
            lastHighlightedButton.style.color = "";
            lastHighlightedButton = null;
        }
        clearTyping();
    }

    function startAutoSolve() {
        solveQuestion();
        if (!observer) {
            observer = new MutationObserver(() => {
                solveQuestion();
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    // This function repeatedly clicks the Start Engine button
    function autoClickStartEngine() {
        if (autoSolveButton && currentQuestionType === "mcq") {
            autoSolveButton.click();
        }
        setTimeout(() => autoClickStartEngine(), 600);
    }

    // 1. Initialize the popup (creates the Start Engine button).
    // 2. Then begin the autoClick loop.
    initializePopup();
    autoClickStartEngine();
})();
