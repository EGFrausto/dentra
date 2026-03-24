import React, { useRef } from 'react';
import { Download, Share2, CheckCircle, X, ShieldCheck } from 'lucide-react';
import Modal from './Modal';

export default function ReceiptModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const receiptRef = useRef(null);
  const { patientName, amount, date, treatment, id, clinicName, clinicAddress, clinicPhone, clinicLogo } = data;
  const fmt = n => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  const txId = `DNT-${id?.split('-')[0]?.toUpperCase() || '9923'}`;
  const locationLine = [clinicAddress, clinicPhone].filter(Boolean).join(' · ') || 'México';

  const handleDownloadPDF = () => {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=800,height=700');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Comprobante ${txId} - Dentra</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f8fafc;
            color: #1e293b;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .receipt {
            max-width: 560px;
            margin: 40px auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          }
          .header {
            background: #0f172a;
            padding: 28px 32px;
            color: white;
          }
          .badge-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
          }
          .icon-box {
            background: #334155;
            border-radius: 8px;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .badge-label {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: #94a3b8;
          }
          .brand { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
          .brand span { color: #64748b; }
          .tx-id { font-size: 12px; color: #64748b; margin-top: 4px; }
          .date-block { text-align: right; }
          .date-val { font-size: 13px; font-weight: 700; }
          .date-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
          .header-inner { display: flex; justify-content: space-between; align-items: flex-start; }
          .body { padding: 28px 32px; }
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 24px;
          }
          .info-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 4px; }
          .info-value { font-size: 15px; font-weight: 900; color: #0f172a; }
          .status-ok { color: #16a34a; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 4px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 10px 0; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; border-bottom: 1px solid #e2e8f0; }
          th:last-child { text-align: right; }
          td { padding: 16px 0; border-bottom: 1px solid #f1f5f9; }
          td:last-child { text-align: right; }
          .item-name { font-size: 13px; font-weight: 700; color: #1e293b; }
          .item-desc { font-size: 11px; color: #94a3b8; margin-top: 2px; }
          .total-row td { padding-top: 20px; border-bottom: none; }
          .total-label { font-size: 12px; font-weight: 700; color: #94a3b8; text-align: right; }
          .total-amount { font-size: 24px; font-weight: 900; color: #0f172a; }
          .footer-note {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px 16px;
            margin-top: 20px;
            font-size: 10px;
            color: #64748b;
            line-height: 1.5;
          }
          .footer {
            background: #f8fafc;
            padding: 16px 32px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
          }
          @media print {
            @page { margin: 0; }
            body { background: white; }
            .receipt { box-shadow: none; margin: 0; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="header-inner">
              <div>
                <div class="badge-row">
                  <div class="icon-box">✓</div>
                  <span class="badge-label">Comprobante de Pago</span>
                </div>
                <div class="brand">
                  ${clinicLogo ? `<img src="${clinicLogo}" style="max-height:44px;max-width:150px;object-fit:contain;display:block;margin-bottom:4px"/>` : ''}
                  ${clinicName || 'Dentra'}
                </div>
                <div class="tx-id">ID Transacción: ${txId}</div>
              </div>
              <div class="date-block">
                <div class="date-val">${date}</div>
                <div class="date-sub">${locationLine}</div>
              </div>
            </div>
          </div>
          <div class="body">
            <div class="info-row">
              <div>
                <div class="info-label">Pagado por</div>
                <div class="info-value">${patientName}</div>
              </div>
              <div>
                <div class="info-label">Estado</div>
                <div class="status-ok">✓ COMPLETADO</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div class="item-name">${treatment || 'Tratamiento Dental General'}</div>
                    <div class="item-desc">Servicios clínicos profesionales realizados en ${clinicName || 'Dentra'}.</div>
                  </td>
                  <td><span style="font-size:13px;font-weight:700;">${fmt(amount || 0)}</span></td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td class="total-label">TOTAL</td>
                  <td class="total-amount">${fmt(amount || 0)}</td>
                </tr>
              </tfoot>
            </table>
            <div class="footer-note">
              Este documento es un comprobante de la atención y transacción realizada. Generado de forma segura por el sistema Dentra.
            </div>
          </div>
          <div class="footer">
            Generado por Dentra • ${new Date().toLocaleDateString('es-MX', {day:'2-digit',month:'long',year:'numeric'})}
          </div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShare = async () => {
    const message = `*Comprobante de Pago – Dentra*\n\nPaciente: ${patientName}\nTratamiento: ${treatment || 'Consulta general'}\nFecha: ${date}\nMonto: ${fmt(amount || 0)}\nEstado: PAGADO\nRef: ${txId}\n\n_Dentra – Gestión Dental Profesional_\n\n*Nota:* Tu comprobante detallado en PDF ha sido generado por la clínica.`;

    let phone = data.patientPhone || '';
    phone = phone.replace(/\D/g, ''); // Extract only digits
    if (phone && phone.length === 10) phone = '52' + phone;

    if (phone) {
      // Direct WA deep-link
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    } else {
      // Fallback if no phone
      if (navigator.share) {
        try {
          await navigator.share({ title: `Comprobante Dentra – ${patientName}`, text: message });
          return;
        } catch (_) { /* fallback */ }
      }
      const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    }
  };

  return (
    <Modal noHeader onClose={onClose} wide>
      {/* Receipt preview (for reference) */}
      <div ref={receiptRef}>
        <div className="bg-slate-900 p-8 rounded-t-3xl border-b border-slate-800/60 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/3 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex justify-between items-start pr-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-slate-700 p-1.5 rounded-lg shadow-sm">
                  <ShieldCheck size={18} className="text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Comprobante de Pago</span>
              </div>
              {clinicLogo
                ? <img src={clinicLogo} alt={clinicName} className="max-h-12 max-w-[160px] object-contain mb-1" />
                : <h1 className="text-3xl font-black text-white tracking-tight">{clinicName || 'Dentra'}<span className="text-slate-500">.</span></h1>
              }
              <p className="text-sm text-slate-500 font-medium mt-1">ID Transacción: {txId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-300">{date}</p>
              <p className="text-xs text-slate-500 mt-0.5 max-w-[180px] text-right leading-tight">{locationLine}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 bg-white">
          <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Pagado por</p>
              <p className="text-lg font-black text-slate-800">{patientName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Estado</p>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold justify-end">
                <CheckCircle size={14} />
                <span>COMPLETADO</span>
              </div>
            </div>
          </div>

          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Descripción</th>
                  <th className="text-right py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr>
                  <td className="py-4">
                    <p className="text-sm font-bold text-slate-700">{treatment || 'Tratamiento Dental General'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Servicios clínicos profesionales realizados en {clinicName || 'Dentra'}.</p>
                  </td>
                  <td className="py-4 text-right">
                    <p className="text-sm font-bold text-slate-800">{fmt(amount || 0)}</p>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-100">
                  <td className="py-5 text-right font-bold text-slate-400 text-sm">TOTAL</td>
                  <td className="py-5 text-right font-black text-2xl text-slate-800">{fmt(amount || 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
              <ShieldCheck size={16} />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Este documento es un comprobante de la atención y transacción realizada.
              Generado de forma segura por el sistema Dentra.
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 bg-slate-50 rounded-b-3xl flex justify-between items-center border-t border-slate-200/60">
        <button onClick={onClose} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2">
          <X size={16} /> CERRAR
        </button>
        <div className="flex gap-2">
          <button onClick={handleShare} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all font-bold text-xs flex items-center gap-2">
            <Share2 size={16}/> COMPARTIR
          </button>
          <button onClick={handleDownloadPDF} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all font-bold text-xs flex items-center gap-2 shadow-md">
            <Download size={16}/> DESCARGAR PDF
          </button>
        </div>
      </div>
    </Modal>
  );
}
