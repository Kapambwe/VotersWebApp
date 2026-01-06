window.downloadHelper = {
    saveAsFile: function (filename, base64Data, contentType = "application/octet-stream") {
        const link = document.createElement("a");
        link.href = `data:${contentType};base64,${base64Data}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
