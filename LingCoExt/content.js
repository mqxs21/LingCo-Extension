(function () {     
    const wordsAndDefinitions = [];     
    let lastHighlightedButton = null;     
    let observer = null;     
    let typingTimeouts = [];     
    let typeSpeed = 5;     
    let isMinimized = false; 

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

        const autoSolveButton = document.createElement("button");         
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
            console.log("Type Speed:", typeSpeed);         
        };                   

        popup.appendChild(startButton);         
        popup.appendChild(autoSolveButton);         
        popup.appendChild(typeSpeedLabel);         
        popup.appendChild(typeSpeedInput);    
        
        const audioLabel = document.createElement("label");
        audioLabel.innerText = "Null";


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

        console.log("Words and Definitions:", wordsAndDefinitions);         
        localStorage.setItem("wordsAndDefinitions", JSON.stringify(wordsAndDefinitions));          

        alert(`Collected ${wordsAndDefinitions.length} words and definitions.`);     
    }      

    function solveQuestion() {
        const promptElement = document.querySelector(".session-title p");
        const answerButtons = document.querySelectorAll(".session-answer-choices button");
    
        const audioPrompt = document.querySelector(".session-audio-button-new");
        if (audioPrompt) {
            console.log("Audio prompt found:", audioPrompt);
    
            const audioButtons = document.querySelectorAll(".btn.line.full-width");
            if (audioButtons && audioButtons.length > 0) {
                console.log("Audio buttons found:", audioButtons);
    
              answerButtons.forEach(button => {
                    const answerText = button.innerText.trim().toLowerCase();
                    const ogText = answerText;
                    const matchedEntry = wordsAndDefinitions.find(
                        item => item.definition.toLowerCase() === answerText
                    );
    
                    if (matchedEntry) {
                        const matchedWord = document.createElement("span");
                        matchedWord.innerText = ` (${matchedEntry.word})`;
                        button.appendChild(matchedWord);
                        console.log("Matched term for audio:", matchedEntry.word);
                    } else {
                        console.warn("No matching definition found for:", answerText);
                    }

                    
                });
            } else {
                console.log("No audio buttons found");
            }
            const potPrompt = document.querySelector(".session-title p");       
            console.log("Pot prompt: ", potPrompt);    
             
            const promptSpanish = wordsAndDefinitions.find(item => item.definition === potPrompt.innerText.toLowerCase());
            if (promptSpanish) {
                potPrompt.innerText = `${potPrompt.innerText} (${promptSpanish.word})`;
            }
    }else{
        const prompt = promptElement.innerText.trim();     
        const potPrompt = document.getElementsByClassName(".session-title p");    
        console.log("Prompt:", prompt);     
        console.log("Pot prompt: ", potPrompt);    
        clearPreviousActions();   
        const promptSpanish = wordsAndDefinitions.find(item => item.definition === potPrompt);
        if (promptSpanish) {
            potPrompt.innerText = `${potPrompt.innerText} (${promptSpanish.word})`;
        }
       


        let answerFound = false;          
        console.log("answer not found");
        const forwardEntry = wordsAndDefinitions.find(item => item.word === prompt);         
        if (forwardEntry) {             
            answerFound = fillOrHighlightAnswer(forwardEntry.definition);         
        }          

        const backwardEntry = wordsAndDefinitions.find(item => item.definition === prompt);         
        if (backwardEntry) {             
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
            const answerText = button.innerText.trim().toLowerCase();             
            if (answerText === correctAnswer.toLowerCase()) {                 
                button.style.backgroundColor = "#28a745";                  
                button.style.color = "white";                 
                lastHighlightedButton = button;                 
                console.log(`Correct Answer Highlighted: ${answerText}`);                 
                answerFound = true;             
            }         
        });         
        const inputBox = document.querySelector(".session-typing input");         
        if (inputBox) {             
            simulateTyping(inputBox, correctAnswer);             
            answerFound = true;         
        }          

        return answerFound;     
    }      

    function simulateTyping(inputElement, value) {         
        clearTyping();          

        inputElement.value = "";          

        inputElement.focus();         
        value.split("").forEach((char, index) => {             
            const timeout = setTimeout(() => {                 
                inputElement.value += char;                 
                inputElement.dispatchEvent(new Event("input", { bubbles: true }));             
            }, index * (100/typeSpeed));              

            typingTimeouts.push(timeout);          
        });          

        const finalTimeout = setTimeout(() => {             
            inputElement.dispatchEvent(new Event("change", { bubbles: true }));         
        }, value.length * 50 + 100);         
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
            console.log("Auto-Solve is now running...");         
        }     
    }      

    initializePopup(); 
})();
