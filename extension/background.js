const get_text_selection = async () => {

    const stylesheet = `

        :root{
            --background: #1f1f1f;
            --middle: #252526;
            --foreground: #333333;
            --text: #eeffff;
            --another-text: #bbbbbb;
            --highlight: #2a2d2e;
            --tag: #FF8964;

        }

        .md-note-modal {
            height: 100%;
            width: 100%;
            position: absolute;
            display: grid;
            place-items: center;
            top: ${window.scrollY}px;
            left: 0;
            z-index: 9999;
        }

        .md-note-modal-background{
            background : #000000a8 !important;
            height: 100%;
            width: 100%;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 10000;
        }

        .md-note-modal-popup {
            display: grid;
            grid-template-rows: auto max-content;
            gap: 0.5em;
            background: var(--background) !important;
            border-radius: 10px;
            width: 50vw;
            min-height: 20vh;
            height: max-content;
            max-height: 80vh;
            overflow: auto;
            padding: 1em;
            z-index: 10001;
            user-select: none;
            box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
        }

        .md-note-modal-selected-text{
            min-height: 15vh;
            max-height: 30vh;
            resize: vertical;
            background: var(--middle) !important;
            color: var(--another-text) !important;
            border: none !important;
            border-radius: 5px;
            padding: 0.5em;
            font-size: 0.9em;
        }

        .md-note-modal-selected-text:focus{
            outline: none;
        }

        .md-note-modal-button-group{
            display: flex;
            gap: 0.5em;
        }

        .md-note-modal-button{
            width: 5em;
            min-width: 80px;
            height: 2.25em;
            min-height: 36px;
            border-radius: 5px;
            background: var(--foreground) !important;
            color: var(--text) !important;
            border: none !important;
            display: grid;
            place-content: center;
        }

        .md-note-save-button{
            color: var(--tag) !important;
        }

        .md-note-modal-button:hover{
            background: var(--highlight) !important;
            cursor: pointer;
        }

        .md-note-confirmation{
            width: 7em;
            min-width: 80px;
            height: 2.25em;
            min-height: 36px;
            border-radius: 5px;
            background: var(--foreground) !important;
            color: var(--text) !important;
            border: none !important;
            position: fixed;
            right: 45%;
            bottom: 1em;
            display: grid;
            place-content: center;
            box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
        }

        .md-note-modal-selected-text::-webkit-scrollbar {
            width: 7px;
        }
        
        .md-note-modal-selected-text::-webkit-scrollbar-track{
            background: transparent !important;
        }
        
        .md-note-modal-selected-text::-webkit-scrollbar-thumb{
            background-color: var(--tag) !important;
        } 
    `

    if(document.body.querySelector(".md-note-modal") !== null){
        return
    }
    
    let selection = window.getSelection().toString();
    
    if(document.head.querySelector("#md-note-pdf-script") === null && selection.length == 0){

        const pdf_script = document.createElement('script');
        pdf_script.src = chrome.runtime.getURL('query-pdf.js');
        pdf_script.setAttribute("id", "md-note-pdf-script")
        document.head.append(pdf_script);

        const pdf_init = async () => {
            return new Promise((resolve, reject) => {

                const onMessage = (message) => {
                    const {origin} = message;
                    if ( 
                        origin === 'chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai' || 
                        origin === 'null'
                    ) {
                        window.removeEventListener('message', onMessage);
                        resolve(true)
                    }
                }
    
                window.addEventListener('message', onMessage );
                window.postMessage("md-note-pdf-init");

                setTimeout(() => {
                    reject(false)
                }, 250);

    
            });
        }

        const getPdfSelectedText = async () => {

            return new Promise((resolve, reject) => {

                const onMessage = ({origin, data}) => {
                    if ( 
                        (origin === 'chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai' || 
                        origin === 'null') &&
                        data && data.type === 'getSelectedTextReply'
                    ) {
                        window.removeEventListener('message', onMessage);
                        resolve(data.selectedText)
                    }
                }

                window.addEventListener('message', onMessage );
                window.postMessage("md-note-pdf-ready");

                setTimeout(() => {
                    reject(false)
                }, 250);

            });
        }

        await pdf_init();
        selection = await getPdfSelectedText();
    }     
    
    if(document.head.querySelector("#md-note-pdf-script") !== null && selection.length == 0){
                
        const getPdfSelectedText = async () => {

            return new Promise((resolve, reject) => {

                const onMessage = ({origin, data}) => {
                    if ( 
                        origin === 'chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai' &&
                        data && data.type === 'getSelectedTextReply'
                    ) {
                        window.removeEventListener('message', onMessage);
                        resolve(data.selectedText)
                    }
                }

                window.addEventListener('message', onMessage );
                window.postMessage("md-note-pdf-ready");

                setTimeout(() => {
                    reject(false)
                }, 250);

            });
        }
        
        selection = await getPdfSelectedText();
    }


    if(selection.length == 0){
        return
    }


    document.body.style.overflow = "hidden";

    const AddStyleSheet = (sheet) => {

        const element = document.createElement("style");
        element.setAttribute("id", "md-note-stylesheet");
        element.textContent = sheet;
        document.head.appendChild(element)

    }

    const CloseModal = (isSaved = false) => {
        document.body.querySelector(".md-note-modal").remove()
        document.body.style.overflow = "auto";

        if(isSaved == true){
            ShowConfirmation()
        }else{
            document.head.querySelector("#md-note-stylesheet").remove()
        }
    }

    const saveFile = async ({
        data,
        name,
        type
    }) => {

        data = data + `\n\n > Source: ${location.href}`

        const bytes = new TextEncoder().encode(data);
        const blob = new Blob([bytes], { type: `${type};charset=utf-8` });
        const fileHandle = await window.showSaveFilePicker({
            excludeAcceptAllOption : true,
            suggestedName : name,
            types : [
                {
                    description: 'Text file',
                    accept: {'text/plain': ['.txt']},
                },
                {
                    description: 'Markdown file',
                    accept: {'text/markdown': ['.md']},
                }
            ]
        });

        const writableStream = await fileHandle.createWritable();
        await writableStream.write(blob);
        await writableStream.close();  

    }

    const RichText = ({key, ctrlKey}) => {

        const display = document.querySelector(".md-note-modal-selected-text")
            
        if(ctrlKey && window.getSelection().toString().length > 0){

            const selection = window.getSelection().toString();
            const selection_start = display.selectionStart;
            const selection_end = display.selectionEnd;
            const text = display.value;
            let updated_text = "";

            switch (key) {
                case "b":

                    updated_text = `${text.slice(0, selection_start)}**${selection}**${text.slice(selection_end)}`

                    if (document.queryCommandSupported('insertText')) {
                        document.execCommand('insertText', false, `**${selection}**`);
                    }
                    else {
                        display.value = updated_text
                    }
                    
                    break;

                case "i":
                    updated_text = `${text.slice(0, selection_start)}*${selection}*${text.slice(selection_end)}`

                    if (document.queryCommandSupported('insertText')) {
                        document.execCommand('insertText', false, `*${selection}*`);
                    }
                    else {
                        display.value = updated_text
                    }
                    break;
                
                case "[":
                    updated_text = `${text.slice(0, selection_start)}[${selection}](${selection})${text.slice(selection_end)}`

                    if (document.queryCommandSupported('insertText')) {
                        document.execCommand('insertText', false, `[${selection}](${selection})`);
                    }
                    else {
                        display.value = updated_text
                    }
                    break;

                case "Dead":
                        updated_text = `${text.slice(0, selection_start)}\`${selection}\`${text.slice(selection_end)}`
    
                        if (document.queryCommandSupported('insertText')) {
                            document.execCommand('insertText', false, `\`${selection}\``);
                        }
                        else {
                            display.value = updated_text
                        }
                        break;

                default:
                    break;
            }
        }

    }

    const CreateModal = (text) => {
        const container = document.createElement("div");
        container.setAttribute("class", "md-note-modal");

        const background = document.createElement("div");
        background.setAttribute("class", "md-note-modal-background");

        const popup = document.createElement("div")
        popup.setAttribute("class", "md-note-modal-popup");

        const text_display = document.createElement("textarea");
        text_display.setAttribute("class", "md-note-modal-selected-text");
        text_display.setAttribute("contenteditable", "true");
        text_display.value = text;

        const button_group = document.createElement("div");
        button_group.setAttribute("class", "md-note-modal-button-group");

        const save_button = document.createElement("button");
        save_button.setAttribute("class", "md-note-modal-button md-note-save-button");
        save_button.textContent = "Save";

        const close_button = document.createElement("button");
        close_button.setAttribute("class", "md-note-modal-button");
        close_button.textContent = "Close";

        button_group.append(...[save_button, close_button])
        popup.append(...[text_display, button_group])
        container.append(...[background, popup])

        background.addEventListener("click", CloseModal)
        close_button.addEventListener("click", CloseModal)
        save_button.addEventListener("click", async _ => {

            try{

                await saveFile({
                    data : text_display.value,
                    type : "text/markdown",
                    name : "note.md"
                })

                CloseModal(true)
                
            }catch(error){

                CloseModal()   
                return
            }
            
        })

        text_display.addEventListener("keydown", RichText)

        return container
    }

    const ShowConfirmation = () => {
        const container = document.createElement("div");
        container.setAttribute("class", "md-note-confirmation");
        container.textContent = 'Saved ✅';

        document.body.append(container);

        setTimeout(() => {
            container.remove();
            document.head.querySelector("#md-note-stylesheet").remove()
            pdf_script.remove();
        }, 2500);
    }


    const component = CreateModal(selection);
    AddStyleSheet(stylesheet);

    document.body.insertAdjacentElement("beforeend", component)
}

chrome.action.onClicked.addListener(({id}) => {
    chrome.scripting.executeScript({
      target: {tabId: id},
      func: get_text_selection
    });
});

