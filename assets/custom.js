document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver((mutations) => {
        const item = document.querySelector('#shopify-pc__banner__body-title');
        
        if (item) {
            console.log('Element found, converting to <p>');
            
            // Create a new <p> element
            const newElement = document.createElement('p');
            
            // Copy all attributes from the old element
            for (let attr of item.attributes) {
                newElement.setAttribute(attr.name, attr.value);
            }
            
            // Copy the inner content
            newElement.innerHTML = item.innerHTML;
            
            // Replace the old element with the new one
            item.parentNode.replaceChild(newElement, item);
            
            // Disconnect observer to stop watching
            observer.disconnect();
        }
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Safety timeout to disconnect observer after 15 seconds
    setTimeout(() => {
        observer.disconnect();
        console.log('Observer timeout - stopped watching');
    }, 15000);
});