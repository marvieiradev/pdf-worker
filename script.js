pdfjsLib.workerSrc = 'pdf.worker.js';
const codigo = document.getElementById("codigo");

document.getElementById('imageFile').addEventListener('change', (e) => {
    var r = new FileReader();
    r.onload = () => {
        document.getElementById('image').src = r.result;
    }
    r.readAsDataURL(e.target.files[0]);
});

document.getElementById('inputFile').addEventListener('change', (e) => {
    var r = new FileReader();
    convertToBase64()
    r.onload = () => {
        document.getElementById('pdf-load').src = r.result;
    }
    r.readAsDataURL(e.target.files[0]);
});

document.getElementById('btnSalvar').addEventListener('click', function () {
    this.classList.add('hidden');

    html2canvas(document.getElementById("container"), {
        scale: window.devicePixelRatio,
        logging: true,
        useCORS: true,
    }).then(canvas => {
        var image = canvas.toDataURL("image/png")
        var doc = new jsPDF('p', 'mm', 'a4');
        doc.addImage(image, 'PNG', 10, 10);
        doc.save(`${codigo.innerText.replace("PEDIDO:", "")}.pdf`);

        this.classList.remove('hidden');
    });
});

function convertToBase64() {
    var selectedFile = document.getElementById("inputFile").files;
    if (selectedFile.length > 0) {
        var fileToLoad = selectedFile[0];
        var fileReader = new FileReader();
        var base64;
        fileReader.onload = function (fileLoadedEvent) {
            base64 = fileLoadedEvent.target.result;
            lerPDF(base64);
        };
        fileReader.readAsDataURL(fileToLoad);
    }
}

function lerPDF(fileToLoad) {
    pdfjsLib.getDocument(fileToLoad).promise.then(function (pdf) {
        var pdfDocument = pdf;
        var pagesPromises = [];

        pdf.getPage(1).then(function (page) {

            var scale = 3;
            var viewport = page.getViewport({ scale: scale });

            var canvas = document.getElementById('pdf-load');
            var context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            var renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            var renderTask = page.render(renderContext);

            renderTask.promise.then(function () {
                //console.log('Página renderizada!');
            });
        });

        for (var i = 0; i < pdf.numPages; i++) {
            (function (pageNumber) {
                pagesPromises.push(getPageText(pageNumber, pdfDocument));
            })(i + 1);
        }

        Promise.all(pagesPromises).then(function (pagesText) {
            var codigoPedido = "" + pagesText;
            codigo.innerText = codigoPedido.substring(codigoPedido.search("PEDIDO:"), 60);
        });

    }, function (reason) {
        console.error(reason);
    });

}

function getPageText(pageNum, PDFDocumentInstance) {
    return new Promise(function (resolve, reject) {
        PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
            pdfPage.getTextContent().then(function (textContent) {
                var textItems = textContent.items;
                var finalString = "";
                for (var i = 0; i < textItems.length; i++) {
                    var item = textItems[i];
                    finalString += item.str + " ";
                }
                resolve(finalString);
            });
        });
    });
}