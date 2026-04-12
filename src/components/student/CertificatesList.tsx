import React from 'react';
import { Certificate } from '@/lib/types';
import jsPDF from 'jspdf';

interface CertificatesListProps {
  studentName: string;
  certificates: Certificate[];
}

export const CertificatesList: React.FC<CertificatesListProps> = ({ studentName, certificates }) => {
  const downloadPDF = (cert: Certificate) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Draw border
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(5);
    doc.rect(5, 5, 287, 200);

    // Header
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(40);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE OF COMPLETION', 148.5, 50, { align: 'center' });

    // Subtext
    doc.setTextColor(100);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('This is to certify that', 148.5, 75, { align: 'center' });

    // Name
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text(studentName, 148.5, 95, { align: 'center' });

    // Course
    doc.setTextColor(100);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('has successfully completed the course', 148.5, 115, { align: 'center' });

    doc.setTextColor(59, 130, 246);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(cert.courses?.title || 'Unknown Course', 148.5, 135, { align: 'center' });

    // Footer
    doc.setTextColor(150);
    doc.setFontSize(12);
    doc.text(`Issued on: ${new Date(cert.issued_at).toLocaleDateString()}`, 148.5, 165, { align: 'center' });
    doc.text(`Certificate ID: ${cert.id}`, 148.5, 175, { align: 'center' });

    // Brand
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.text('SmartLMS Learning Platform', 148.5, 190, { align: 'center' });

    doc.save(`${cert.courses?.title}_Certificate.pdf`);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-8">Your Certificates</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {certificates.length > 0 ? (
          certificates.map(cert => (
            <div key={cert.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-xl transition-shadow border-t-4 border-t-blue-500">
              <div className="text-5xl mb-6">📜</div>
              <h3 className="font-black text-xl text-slate-900 mb-2">{cert.courses?.title}</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Issued: {new Date(cert.issued_at).toLocaleDateString()}</p>

              <div className="flex gap-3 w-full">
                  <a
                    href={cert.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex-1 py-3 text-xs"
                  >
                    View
                  </a>
                  <button
                    onClick={() => downloadPDF(cert)}
                    className="btn-secondary px-4 py-3"
                    title="Download PDF"
                  >
                    📥
                  </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <div className="text-5xl mb-4">🎓</div>
            <p className="text-slate-500 font-medium">Complete courses with passing grades to earn certificates!</p>
          </div>
        )}
      </div>
    </div>
  );
};
