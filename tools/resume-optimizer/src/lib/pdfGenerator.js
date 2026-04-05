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

    // 从预览元素生成 PDF
    async generate() {
        const element = document.getElementById('resumePreview');
        if (!element) {
            console.error('Resume preview element not found');
            return;
        }

        const btn = document.getElementById('downloadPdfBtn');
        const originalText = btn ? btn.innerHTML : '';

        try {
            // 显示加载状态
            if (btn) {
                btn.innerHTML = '<span class="loading-spinner mr-2"></span>生成中...';
                btn.disabled = true;
            }

            // 克隆元素用于 PDF 生成
            let clone = element.cloneNode(true);
            clone.style.width = '210mm';
            clone.style.minHeight = '297mm';
            clone.style.padding = '20mm';
            clone.style.background = 'white';

            // 临时添加到 body 用于渲染
            clone.style.position = 'absolute';
            clone.style.left = '-9999px';
            document.body.appendChild(clone);

            // 生成 PDF
            const worker = html2pdf()
                .set(this.options)
                .from(clone);

            // 获取当前时间戳用于文件名
            const timestamp = new Date().toISOString().slice(0, 10);
            this.options.filename = `简历_${store.getState().profile.name || '未命名'}_${timestamp}.pdf`;

            await worker.save();

            this.showNotification('PDF 导出成功！', 'success');
        } catch (error) {
            console.error('PDF generation failed:', error);
            this.showNotification('PDF 导出失败，请重试', 'error');
        } finally {
            // 确保清理克隆的 DOM 节点
            const clone = document.body.querySelector('[style*="left: -9999px"][style*="210mm"]');
            if (clone && clone.parentNode) {
                clone.parentNode.removeChild(clone);
            }

            // 恢复按钮状态
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }
    }

    // 下载 PDF
    download() {
        this.generate();
    }

    // 在新标签页预览（使用 textContent 安全方式写入）
    preview() {
        const element = document.getElementById('resumePreview');
        if (!element) return;

        // 使用 textContent 写入内容，防止 XSS
        const printWindow = window.open('', '_blank', 'noopener,noreferrer');
        if (!printWindow) {
            this.showNotification('无法打开预览窗口，请允许弹出窗口', 'error');
            return;
        }

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

    // 显示通知（使用 textContent 防止 XSS）
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 fade-in ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' : 'bg-indigo-500'
        } text-white`;

        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-center gap-2';

        const icon = document.createElement('i');
        icon.className = `fas ${
            type === 'success' ? 'fa-check-circle' :
            type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'
        }`;
        wrapper.appendChild(icon);

        const textSpan = document.createElement('span');
        textSpan.textContent = message; // 安全：使用 textContent
        wrapper.appendChild(textSpan);

        notification.appendChild(wrapper);
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(10px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// 创建全局实例
const pdfGenerator = new PDFGenerator();
