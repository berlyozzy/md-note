let GetPDFContents = async (action) => {
    try{
        document.querySelector('embed').postMessage({type: action}, '*')
    }catch(error){
        switch (action) {
            case "initialize":
                console.log("Enabling PDF")
                break;
        
            default:
                console.log("No Selection Found")
                break;
        }

    }
}

GetPDFContents("initialize")

window.addEventListener('message', (message) => {

    switch (message.data) {
        case "md-note-pdf-init":
            GetPDFContents("initialize");
            break;
    
        case "md-note-pdf-ready":
            GetPDFContents("getSelectedText");
            break;
    }
});

//  https://stackoverflow.com/questions/61076303/how-can-i-get-selected-text-in-pdf-in-javascript

// Doesn't work on local PDF files opened through Chrome
// Chromium Bug 1219825 : https://bugs.chromium.org/p/chromium/issues/detail?id=1219825