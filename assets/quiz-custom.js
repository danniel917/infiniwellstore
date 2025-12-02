// quiz-custom.js

// Initialize quiz tracking
let questionsAnswered = [];
let isCompleted = false;
let questionHistory = [];
// Change the completion question ID at the top
const COMPLETION_QUESTION_ID = 'f2fad33d76c683a5ef0c4bb89708c786ac478936';

// Reusable method to handle question ID and apply custom logic
function questionLoaded(questionId) {
    // Define question IDs to monitor
    const emailQuestionId = "f2fad33d76c683a5ef0c4bb89708c786ac478936";
    const secondQuestionId = "7daadc671326e0565ba567a2258164e97a940c70";
    
    if (questionId === emailQuestionId || questionId === secondQuestionId) {
        setTimeout(() => {
            const quizWrapper = document.getElementById('octane-quiz-wrapper');
            if (!quizWrapper) return;
            
            const input = quizWrapper.querySelector('input[type="email"], input[type="tel"]');
            const button = quizWrapper.querySelector('button.skip--button.oct-quiz-btn--primary-text');
            
            if (input && button) {
                // Disable button initially if input is empty
                if (!input.value.trim()) {
                    button.style.setProperty('pointer-events', 'none', 'important');
                    button.style.setProperty('opacity', '0.5', 'important');
                }
                
                // Listen for input changes
                input.addEventListener('input', () => {
                    const hasValue = input.value.trim().length > 0;
                    
                    if (hasValue) {
                        // Enable button when input has value
                        button.style.setProperty('pointer-events', 'auto', 'important');
                        button.style.setProperty('opacity', '1', 'important');
                        console.log('✅ Button enabled - Input value:', input.value);
                    } else {
                        // Disable button when input is empty
                        button.style.setProperty('pointer-events', 'none', 'important');
                        button.style.setProperty('opacity', '0.5', 'important');
                        console.log('❌ Button disabled - Input is empty');
                    }
                });
            }
        }, 100);
    }
}

// Function to handle back button click
function handleBackClick(e) {
    e.preventDefault();
    
    // Don't allow back navigation if completed or on first question
    if (isCompleted || questionsAnswered.length === 0) {
        return;
    }
    
    // Find Octane's native back button using title attribute
    const octaneBackButton = document.querySelector('button[title="Back"]');
    
    if (octaneBackButton) {
        octaneBackButton.click();
        
        // Wait for the back navigation to complete, then recreate header
        setTimeout(() => {
            const outerWrapper = document.getElementById('octane-quiz-wrapper');
            if (outerWrapper) {
                createCustomHeader(outerWrapper);
            }
        }, 200);
    } else {
        window.history.back();
    }
}

// Function to handle retake quiz click
function handleRetakeClick(e) {
    e.preventDefault();
    
    // Reset all tracking variables
    questionsAnswered = [];
    isCompleted = false;
    questionHistory = [];
    
    // Redirect to quiz page without hash
    window.location.href = window.location.origin + '/pages/quiz';
}

// Function to add arrow icons to next buttons
function addArrowToNextButtons() {
    const nextButtons = document.querySelectorAll('.next--button');
    
    nextButtons.forEach(button => {
        // Check if icon already exists to avoid duplicates
        if (!button.querySelector('.next-arrow-icon')) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'next-arrow-icon';
            iconSpan.innerHTML = `
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.0391 0L9.96094 1.07812L15.0469 6.16406H0V7.66406H15.0469L9.96094 12.75L11.0391 13.8281L17.4141 7.45312L17.9297 6.91406L17.4141 6.375L11.0391 0Z" fill="CurrentColor"/>
                </svg>
            `;
            button.appendChild(iconSpan);
        }
    });
}

// Function to create/update custom header
function createCustomHeader(quizWrapper, isResultsPage = false) {
    // Always target the INNER wrapper (#octane-quiz-wrapper)
    const innerWrapper = document.getElementById('octane-quiz-wrapper');
    if (!innerWrapper) {
        console.log('Inner wrapper not found');
        return;
    }
    
    // Remove existing custom header if present
    const existingHeader = innerWrapper.querySelector('.custom-quiz-header');
    if (existingHeader) {
        existingHeader.remove();
    }

    // Calculate progress (keep existing logic)
    let progressPercentage = 0;
    let displayText = '0%';

    if (isCompleted || isResultsPage) {
        progressPercentage = 100;
        displayText = 'Completed';
    } else {
        const totalQuestionsEncountered = questionHistory.length;
        const answeredCount = questionsAnswered.length;
        
        if (answeredCount > 0) {
            if (answeredCount === 1) {
                progressPercentage = 5;
            } else if (answeredCount === 2) {
                progressPercentage = 15;
            } else if (answeredCount === 3) {
                progressPercentage = 30;
            } else if (answeredCount === 4) {
                progressPercentage = 45;
            } else if (answeredCount === 5) {
                progressPercentage = 60;
            } else if (answeredCount === 6) {
                progressPercentage = 72;
            } else if (answeredCount === 7) {
                progressPercentage = 82;
            } else if (answeredCount === 8) {
                progressPercentage = 90;
            } else {
                progressPercentage = Math.min(98, 90 + ((answeredCount - 8) * 2));
            }
            
            displayText = progressPercentage + '%';
        }
    }

    // Determine button display and state
    let buttonHTML = '';
    
    if (isResultsPage) {
        buttonHTML = `
            <button class="back-button retake-button" id="custom-retake-button">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="2"/>
                </svg>
                Retake Quiz
            </button>
        `;
    } else {
        const isDisabled = questionsAnswered.length === 0 || isCompleted;
        
        buttonHTML = `
            <button class="back-button ${isDisabled ? 'disabled' : ''}" id="custom-back-button" ${isDisabled ? 'disabled' : ''}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="2"/>
                </svg>
                Back
            </button>
        `;
    }

    // Create header structure
    const header = document.createElement('div');
    header.className = 'custom-quiz-header';
    header.innerHTML = `
        <div class="header-content">
            ${buttonHTML}
            <div class="logo">
                <img src="https://infiniwell.com/cdn/shop/files/Logo_1_b027b35d-930c-4186-b136-b74658f61da6.png" alt="Company Logo">
            </div>
            <div class="progress-indicator">
                <span class="progress-percentage ${isCompleted || isResultsPage ? 'completed' : ''}">${displayText}</span>
            </div>
        </div>
        <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${progressPercentage}%"></div>
        </div>
    `;

    // Insert header at the very top of the INNER wrapper
    innerWrapper.insertBefore(header, innerWrapper.firstChild);
    
    console.log('Header inserted into inner wrapper', { isResultsPage, progressPercentage });
    
    // Add click event listeners
    if (isResultsPage) {
        const retakeButton = header.querySelector('#custom-retake-button');
        if (retakeButton) {
            retakeButton.addEventListener('click', handleRetakeClick);
        }
    } else {
        const backButton = header.querySelector('#custom-back-button');
        if (backButton) {
            backButton.addEventListener('click', handleBackClick);
        }
    }
}

// Expose createCustomHeader globally so results.js can use it
window.createCustomHeader = createCustomHeader;

// Track questions to calculate total
document.addEventListener('octane.quiz.questionLoaded', function (e) {
    const quizWrapper = e.detail.quiz_wrapper_element;
    const questionId = e.detail.question_id;

    // questionLoaded(questionId);
    
    // Track unique questions in history
    if (!questionHistory.includes(questionId)) {
        questionHistory.push(questionId);
    }
    
    // Check if this is the completion question
    if (questionId === COMPLETION_QUESTION_ID) {
        isCompleted = true;
    }

    // Scroll the quiz wrapper container to top, accounting for sticky header
    setTimeout(() => {
        const outerWrapper = document.getElementById('octane-quiz-wrapper');
        if (outerWrapper) {
            const headerHeight = 97.33; // Sticky header height
            
            // Get the wrapper's position
            const wrapperTop = outerWrapper.getBoundingClientRect().top + window.pageYOffset;
            
            // Scroll to position minus header height
            window.scrollTo({
                top: wrapperTop - headerHeight,
                behavior: 'smooth'
            });
        }
    }, 500);
    
    // Create/update header
    createCustomHeader(quizWrapper);
    
    // Add arrow icons to next buttons after a brief delay to ensure buttons are rendered
    setTimeout(() => {
        addArrowToNextButtons();
    }, 100);
}, false);

// Track when question is answered to update progress
document.addEventListener('octane.quiz.questionAnswered', function (e) {
    const quizWrapper = e.detail.quiz_wrapper_element;
    const questionId = e.detail.question_id;
    
    // Only increment if this specific question hasn't been answered before
    if (!isCompleted && !questionsAnswered.includes(questionId)) {
        questionsAnswered.push(questionId);
    } else if (questionsAnswered.includes(questionId)) {
        console.log('Question already answered before, not incrementing');
    }
    
    // Check if this answer triggers completion
    if (questionId === COMPLETION_QUESTION_ID) {
        isCompleted = true;
    }
    
    // Update header immediately after answer
    setTimeout(() => {
        createCustomHeader(quizWrapper);
    }, 50);
    
    // Also check for next buttons after answering
    setTimeout(() => {
        addArrowToNextButtons();
    }, 300);
}, false);

// MutationObserver to detect when results load dynamically
const observeResults = new MutationObserver(function(mutations) {
    const innerWrapper = document.getElementById('octane-quiz-wrapper');
    
    if (!innerWrapper) return;
    
    // Check if results content appeared
    const hasResults = innerWrapper.querySelector('.quiz-section') ||
                      innerWrapper.querySelector('.quiz-product--desktop') ||
                      innerWrapper.querySelector('.quiz-product--mobile');
    
    if (hasResults && isCompleted) {
        // ALWAYS replace header when results appear - even if header exists
        const existingHeader = innerWrapper.querySelector('.custom-quiz-header');
        const hasRetakeButton = existingHeader?.querySelector('#custom-retake-button');
        
        // If header doesn't have retake button, replace it
        if (!hasRetakeButton) {
            console.log('MutationObserver: Replacing header with Retake Quiz button');
            if (existingHeader) existingHeader.remove();
            createCustomHeader(innerWrapper, true);
        }
    }
    
    // Check for new next buttons
    addArrowToNextButtons();
});

// Handle quiz completion - show header on results page
document.addEventListener('octane.quiz.completed', function (e) {
    isCompleted = true;
    
    console.log('Quiz completed, waiting for results to render...');
    
    // Don't create header immediately, wait for results.js to render first
    // The MutationObserver will detect results and create the proper header
}, false);

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired');
    
    const innerWrapper = document.getElementById('octane-quiz-wrapper');
    
    if (innerWrapper) {
        console.log('Inner wrapper found');
        
        // Check if we're on results page
        const hasResults = innerWrapper.querySelector('.quiz-section') ||
                          innerWrapper.querySelector('.quiz-product--desktop') ||
                          innerWrapper.querySelector('.quiz-product--mobile');
        
        if (hasResults) {
            isCompleted = true;
            console.log('DOMContentLoaded: Results page detected, creating header');
            createCustomHeader(innerWrapper, true);
        } else {
            console.log('DOMContentLoaded: Question page detected, creating header');
            createCustomHeader(innerWrapper);
        }
        
        // Add arrows to any existing next buttons
        setTimeout(() => {
            addArrowToNextButtons();
        }, 100);
        
        // Start observing the inner wrapper for dynamic changes
        observeResults.observe(innerWrapper, {
            childList: true,
            subtree: true
        });
        console.log('MutationObserver started');
    } else {
        console.log('Inner wrapper NOT found on DOMContentLoaded');
    }
});