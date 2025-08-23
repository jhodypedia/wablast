(function(){
  // Intersection Observer for .reveal
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold:.12 });
  revealEls.forEach(el => io.observe(el));

  // jQuery helpers
  const notify = (icon, title, text) => Swal.fire({ icon, title, text, timer: 1600, showConfirmButton: false });

  // Login
  $('#formLogin').on('submit', function(e){
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(this).entries());
    $.post('/api/login', payload).done(()=>{ notify('success','Berhasil','Login sukses'); setTimeout(()=>location.href='/',700); })
      .fail(r=>notify('error','Gagal', r.responseJSON?.message||'Error'));
  });

  // Register
  $('#formRegister').on('submit', function(e){
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(this).entries());
    $.post('/api/register', payload).done(()=>{ notify('success','Registered','Akun dibuat'); setTimeout(()=>location.href='/login',800); })
      .fail(r=>notify('error','Gagal', r.responseJSON?.message||'Error'));
  });

  // Logout
  $('#btnLogout').on('click', function(){
    $.post('/api/logout').done(()=>{ notify('success','Logout','Sampai jumpa'); setTimeout(()=>location.href='/login',700); });
  });

  // Dashboard (QR + Blast)
  if (window.__USER_ID__) {
    const socket = io({ query: { userId: window.__USER_ID__ } });
    const $qr = $('#qrBox'), $status = $('#waStatus');

    socket.on('qr', (dataUrl)=>{
      $qr.hide().html(`<img src="${dataUrl}" alt="QR Code" />`).fadeIn(200);
      bounce($qr[0]);
    });
    socket.on('ready', (msg)=>{ $status.text(msg); glow($qr[0]); });
    socket.on('status', (msg)=>{ $status.text(msg); });

    $('#btnConnectWA').on('click', ()=>{
      $.post('/api/wa/connect').done(()=> notify('info','Menunggu Scan','Silakan scan QR di panel'))
        .fail(r=> notify('error','Gagal', r.responseJSON?.message||'Error'));
    });

    // Upload CSV/TXT
    $('#formUpload').on('submit', function(e){
      e.preventDefault();
      const fd = new FormData(this);
      $.ajax({ url:'/api/wa/upload', method:'POST', data: fd, contentType:false, processData:false })
      .done(res=>{
        const arr = res.numbers || [];
        const valNow = $('#numbers').val().trim();
        const merged = [...new Set([...(valNow?valNow.split(/[\n,]+/):[]), ...arr])].filter(Boolean);
        $('#numbers').val(merged.join('\n'));
        notify('success','Nomor Dimuat', `${merged.length} nomor siap`);
        shake($('#numbers')[0]);
      })
      .fail(r=> notify('error','Gagal', r.responseJSON?.message||'Error'));
    });

    // Kirim Blast
    $('#btnBlast').on('click', async function(){
      const numbers = $('#numbers').val().split(/[\n,]+/).map(v=>v.replace(/\D/g,'')).filter(Boolean);
      const message = $('#message').val().trim();
      if (!numbers.length || !message) return notify('warning','Data kurang','Isi nomor & pesan');

      $('#progBar').css('width','0%');
      $('#logBox').text('');
      notify('info','Mengirim','Proses blast dimulai');

      // Batching kecil di sisi UI (opsional; server tetap satu request)
      $.ajax({
        url:'/api/wa/blast', method:'POST',
        contentType:'application/json',
        data: JSON.stringify({ numbers, message })
      }).done(res=>{
        const total = res.ok + res.fail;
        $('#progBar').css('width','100%');
        $('#logBox').text(JSON.stringify(res.logs.slice(-50), null, 2));
        Swal.fire({ icon: res.fail? 'warning':'success', title:'Selesai',
          html:`Terkirim: <b>${res.ok}</b> | Gagal: <b>${res.fail}</b>`,
          timer: 2200, showConfirmButton:false
        });
      }).fail(r=>{
        notify('error','Error', r.responseJSON?.message || 'Terjadi kesalahan');
      });
    });

    function bounce(el){ el.style.transition='transform .4s'; el.style.transform='scale(1.03)'; setTimeout(()=> el.style.transform='scale(1)', 220); }
    function glow(el){ el.style.boxShadow='0 0 0 0 rgba(16,185,129,.7)'; el.animate([
      { boxShadow:'0 0 0 0 rgba(16,185,129,.7)' },
      { boxShadow:'0 0 0 14px rgba(16,185,129,0)' }
    ], { duration: 800, iterations: 1 }); }
    function shake(el){ el.animate([{ transform:'translateX(0)'},{ transform:'translateX(-3px)'},{ transform:'translateX(3px)'},{ transform:'translateX(0)'}],{ duration:200 }); }
  }
})();
