interface Props {
  onClick: () => void;
}

export function RepairButton({ onClick }: Props) {
  return (
    <section className="px-4 pb-4">
      <div style={{ borderTop: '1px solid #e4e0db', paddingTop: 16 }}>
        <button
          onClick={onClick}
          className="w-full flex items-center gap-3"
          style={{
            border: '1px solid #e4e0db',
            borderRadius: 8,
            backgroundColor: '#fff',
            padding: 16,
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
          </svg>
          <div className="flex-1 text-left">
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
              Request a Repair
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#b5ada5' }}>
              Ship to us · Photo assessment included
            </p>
          </div>
          <span style={{ color: '#ccc', fontSize: 18, fontWeight: 300 }}>›</span>
        </button>
      </div>
    </section>
  );
}
