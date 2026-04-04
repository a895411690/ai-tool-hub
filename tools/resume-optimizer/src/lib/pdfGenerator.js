/**
 * PDF Generator Module
 * Uses html2pdf.js for client-side PDF generation
 */

class PDFGenerator {
    constructor() {
        this.options = {
            margin: 10,
            filename: '简历.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: false
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait'
            }
        };
    }

    // Generate PDF from preview element
    async generate() {
        const element = document.getElementById('resumePreview');
        if (!element) {
            console.error('Resume preview element not found');
            return;
        }

        try {
            // Show loading state
            const btn = document.querySelector('button[onclick="pdfGenerator.download()"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="loading-spinner mr-2"></span>生成中...';
            btn.disabled = true;

            // Clone element for PDF generation
            const clone = element.cloneNode(true);
            clone.style.width = '210mm';
            clone.style.minHeight = '297mm';
            clone.style.padding = '20mm';
            clone.style.background = 'white';
            
            // Temporarily append to body for rendering
            clone.style.position = 'absolute';
            clone.style.left = '-9999px';
            document.body.appendChild(clone);

            // Generate PDF
            const worker = html2pdf()
                .set(this.options)
                .from(clone);

            // Get current timestamp for filename
            const timestamp = new Date().toISOString().slice(0, 10);
            this.options.filename = `简历_${store.getState().profile.name || '未命名'}_${timestamp}.pdf`;

            await worker.save();

            // Cleanup
            document.body.removeChild(clone);

            // Restore button
            btn.innerHTML = originalText;
            btn.disabled = false;

            this.showNotification('PDF 导出成功！', 'success');
        } catch (error) {
            console.error('PDF generation failed:', error);
            this.showNotification('PDF 导出失败，请重试', 'error');
            
            // Restore button
            const btn = document.querySelector('button[onclick="pdfGenerator.download()"]');
            btn.innerHTML = '<i class="fas fa-download mr-2"></i>导出 PDF';
            btn.disabled = false;
        }
    }

    // Download PDF
    download() {
        this.generate();
    }

    // Preview in new tab
    preview() {
        const element = document.getElementById('resumePreview');
        if (!element) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>简历预览</title>
                <style>
                    body { margin: 0; padding: 20mm; background: white; }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                ${element.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 fade-in ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 'bg-indigo-500'
        } text-white`;
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(10px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Create global instance
const pdfGenerator = new PDFGenerator();
