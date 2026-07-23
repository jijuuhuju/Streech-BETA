const canvas = document.getElementById("streechCanvas");
const ctx = canvas.getContext("2d");
const dropZone = document.getElementById("dropZone");
const turboBtn = document.getElementById("turboBtn");
const loader = document.getElementById("loadingScreen");
const loadingText = document.getElementById("loadingText");

let selectedBlocks = [];
let isRunning = false;
let isTurbo = false;
let saveCounter = 1; 

let player = { x: 50, y: 120, size: 28, vx: 2, vy: 0, speed: 3, jumpForce: 8, color: "#38bdf8", isRainbow: false, angle: 0, theme: "normal", isAfterimage: false, trail: [] };
let gravity = 0.4;
let loopRemaining = -1; 
let enemy = { x: 280, y: 130, size: 20, vx: -1.5, alive: true };
let isHitChecking = false; 

// 1. 起動時のロード演出（2秒後に選択モーダルを表示）
setTimeout(() => {
    loader.style.opacity = "0";
    setTimeout(() => { 
        loader.style.display = "none"; 
        document.getElementById("modeSelectScreen").style.display = "flex"; 
    }, 400);
}, 2000);

function selectStartMode(mode) {
    document.getElementById("modeSelectScreen").style.display = "none";
    if (mode === "temp") {
        addCommand("SPEED_UP");
        addCommand("TURN_RIGHT");
        addCommand("COSTUME_GOLD");
        addCommand("FOREVER_LOOP");
        alert("✨ テンプレートをロードしました！");
    }
}

// ブロック追加 ＆ クリックで削除
function addCommand(command) {
    if (selectedBlocks.length === 0) dropZone.innerHTML = "";
    selectedBlocks.push(command);
    const blockIndex = selectedBlocks.length - 1;
    
    const newBlock = document.createElement("div");
    newBlock.className = "block";
    newBlock.setAttribute("data-index", blockIndex);
    
    if (command === "SPEED_UP") { newBlock.textContent = "🚀 【移動速度 1.7倍】"; newBlock.className += " green"; }
    if (command === "SUPER_DASH") { newBlock.textContent = "🚀 【スーパーダッシュ（速度3倍）】"; newBlock.className += " green"; }
    if (command === "JUMP_HIGHER") { newBlock.textContent = "🦘 【ジャンプ力 1.5倍】"; newBlock.className += " green"; }
    if (command === "TURN_RIGHT") { newBlock.textContent = "↩️ 【右に少し傾ける】"; newBlock.className += " green"; }
    if (command === "TURN_LEFT") { newBlock.textContent = "↪️ 【左に少し傾ける】"; newBlock.className += " green"; }
    if (command === "RAINBOW_MODE") { newBlock.textContent = "🌈 【レインボーモードON】"; newBlock.className += " blue"; }
    if (command === "SHRINK_PLAYER") { newBlock.textContent = "🔍 【サイズを半分にする】"; newBlock.className += " blue"; }
    if (command === "AFTERIMAGE_ON") { newBlock.textContent = "💨 【残像エフェクトON】"; newBlock.className += " blue"; }
    if (command === "COSTUME_NEO") { newBlock.textContent = "👕 【コスチューム：ネオン顔】"; newBlock.className += " blue"; }
    if (command === "COSTUME_GOLD") { newBlock.textContent = "👑 【コスチューム：ゴールド顔】"; newBlock.className += " blue"; }
    if (command === "FOREVER_LOOP") { newBlock.textContent = "🔄 【[制御] ずっと繰り返す】"; newBlock.className += " orange"; }
    if (command === "LOOP_5") { newBlock.textContent = "🔁 【[制御] 5回繰り返す】"; newBlock.className += " orange"; }
    if (command === "HIT_CHECK") { newBlock.textContent = "👾 【[調べる] 敵との当たり判定を追加】"; newBlock.className += " orange"; }
    
    newBlock.addEventListener("click", function() {
        const idx = parseInt(this.getAttribute("data-index"));
        selectedBlocks.splice(idx, 1);
        rebuildDropZone();
    });
    dropZone.appendChild(newBlock);
}

function rebuildDropZone() {
    dropZone.innerHTML = "";
    if (selectedBlocks.length === 0) {
        dropZone.innerHTML = '<div id="emptyNotice">(ここに組み立てたブロックが表示されます)</div>';
        return;
    }
    const tempArray = [...selectedBlocks]; selectedBlocks = [];
    tempArray.forEach(cmd => addCommand(cmd));
}

// 保存ボタン（iPad用にピュアなBlobテキストファイル形式）
function saveToFile() {
    if (selectedBlocks.length === 0) { alert("ブロックを組み立ててね！"); return; }
    
    loadingText.textContent = "プロジェクトを保存中...";
    loader.style.display = "flex";
    loader.style.opacity = "1";
    
    const jsonText = JSON.stringify(selectedBlocks);
    const blob = new Blob([jsonText], { type: "text/plain;charset=utf-8" });
    
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "streech_project" + saveCounter + ".txt"; // ファイル名は streech_project1.txt
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    saveCounter++; 

    setTimeout(() => {
        loader.style.opacity = "0";
        setTimeout(() => { 
            loader.style.display = "none"; 
            loadingText.textContent = "streech v8 を起動中..."; 
        }, 400);
    }, 1500);
}

function triggerFileLoad() { document.getElementById("loadFileBtn").click(); }

// ★【バグ完全消去】文字読み込みだけに特化させ、100%確実に配列を復元するロード命令
function loadFromFile() {
    const fileInput = document.getElementById("loadFileBtn");
    const files = fileInput.files; 
    if (!files || files.length === 0) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const rawData = e.target.result.trim();
            // 読み込んだ手紙（テキスト）が、正しいstreechのデータ（[ ]から始まる配列）かチェック
            if (!rawData.startsWith("[")) {
                // 画像ファイルなど、テキスト以外の不正なファイルが来たらハッカー防止風にカッコよく拒否する！
                alert("エラー: 不正なファイル形式です。アクセスを拒否しました。");
                fileInput.value = "";
                return;
            }
            
            selectedBlocks = JSON.parse(rawData); 
            rebuildDropZone(); 
            alert("プロジェクトファイルを読み込みました！🚀");
        } catch (err) { 
            alert("エラー: 正しいstreechの保存ファイルではありません。"); 
        }
        fileInput.value = "";
    };
    reader.readAsText(files[0], "UTF-8");
}

// 🟢 実行
function compileAndRun() {
    if (isRunning) return;
    player.angle = 0; isHitChecking = false; enemy.alive = true;
    loopRemaining = selectedBlocks.includes("LOOP_5") ? 5 : -1;

    selectedBlocks.forEach(block => {
        if (block === "SPEED_UP") player.speed = 5.5;
        if (block === "SUPER_DASH") player.speed = 10;
        if (block === "JUMP_HIGHER") player.jumpForce = 12;
        if (block === "SHRINK_PLAYER") player.size = 14;
        if (block === "RAINBOW_MODE") player.isRainbow = true;
        if (block === "AFTERIMAGE_ON") player.isAfterimage = true;
        if (block === "TURN_RIGHT") player.angle += 25;
        if (block === "TURN_LEFT") player.angle -= 25;
        if (block === "COSTUME_NEO") player.theme = "neo";
        if (block === "COSTUME_GOLD") player.theme = "gold";
        if (block === "HIT_CHECK") isHitChecking = true; 
    });
    isRunning = true;
}

// 🔴 停止
function stopProgram() { isRunning = false; player.vy = 0; player.trail = []; loopRemaining = -1; }

function toggleTurbo() {
    isTurbo = !isTurbo;
    turboBtn.textContent = isTurbo ? "⚡ターボモード中！" : "⚡ターボモードにする";
    turboBtn.style.color = isTurbo ? "#ff007f" : "#ffffff";
}

function gameLoop() {
    let loops = isTurbo ? 4 : 1;
    for (let i = 0; i < loops; i++) {
        if (isRunning && enemy.alive) {
            enemy.x += enemy.vx;
            if (enemy.x < 150 || enemy.x + enemy.size > canvas.width - 20) enemy.vx *= -1;
        }
        if (isRunning) {
            if (player.isAfterimage) {
                player.trail.push({ x: player.x, y: player.y, angle: player.angle });
                if (player.trail.length > 6) player.trail.shift();
            }
            player.x += player.vx * (player.speed / 3);
            if (player.x < 0 || player.x + player.size > canvas.width) player.vx *= -1;
            player.vy += gravity; player.y += player.vy;
            
            if (player.y + player.size >= 150) {
                player.y = 150 - player.size;
                if (loopRemaining > 0) {
                    player.vy = -player.jumpForce; loopRemaining--;
                    if (loopRemaining === 0) { loopRemaining = -1; isRunning = false; }
                } else if (selectedBlocks.includes("FOREVER_LOOP")) {
                    player.vy = -player.jumpForce;
                } else {
                    player.vy = 0; isRunning = false;
                }
            }
            if (isHitChecking && enemy.alive && player.x < enemy.x + enemy.size && player.x + player.size > enemy.x && player.y < enemy.y + enemy.size && player.y + player.size > enemy.y) {
                if (player.y + player.size <= enemy.y + 10 && player.vy > 0) { enemy.alive = false; player.vy = -7; } 
                else { stopProgram(); alert("👾 モンスターにぶつかった！"); }
            }
            if (player.isRainbow) player.color = `hsl(${(Date.now() / 2) % 360}, 100%, 50%)`;
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#8bc34a"; ctx.fillRect(0, 150, canvas.width, 20);

    if (enemy.alive) {
        ctx.fillStyle = "#9c27b0"; ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
        ctx.fillStyle = "#ff1744"; ctx.fillRect(enemy.x + 3, enemy.y + 4, 3, 3); ctx.fillRect(enemy.x + 12, enemy.y + 4, 3, 3);
    }

    if (isRunning && player.isAfterimage && player.trail.length > 0) {
        player.trail.forEach((pos, index) => {
            let opacity = (index + 1) / player.trail.length * 0.3;
            ctx.save(); ctx.translate(pos.x + player.size / 2, pos.y + player.size / 2); ctx.rotate((pos.angle * Math.PI) / 180);
            ctx.fillStyle = player.theme === "neo" ? `rgba(255, 0, 127, ${opacity})` : `rgba(0, 188, 212, ${opacity})`;
            ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size); ctx.restore();
        });
        ctx.globalAlpha = 1.0;
    }

    ctx.save(); ctx.translate(player.x + player.size / 2, player.y + player.size / 2); ctx.rotate((player.angle * Math.PI) / 180);
    let c = player.isRainbow ? player.color : (player.theme === "neo" ? "#111" : (player.theme === "gold" ? "#ffd700" : "#00bcd4"));
    ctx.fillStyle = c; ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size);
if (player.theme === "neo") { ctx.strokeStyle = "#ff007f"; ctx.lineWidth = 2; ctx.strokeRect(-player.size / 2, -player.size / 2, player.size, player.size); }ctx.fillStyle = player.theme === "neo" ? "#00ffcc" : (player.theme === "gold" ? "#b8860b" : "#ffffff");ctx.fillRect(-player.size/4, -player.size/4, player.size/5, player.size/4); ctx.fillRect(player.size/10, -player.size/4, player.size/5, player.size/4);ctx.fillStyle = "#000000";if (player.theme === "gold") { ctx.fillRect(-player.size/4, -player.size/4, player.size/5, 2); ctx.fillRect(player.size/10, -player.size/4, player.size/5, 2); }else { ctx.fillRect(-player.size/5, -player.size/8, player.size/12, player.size/12); ctx.fillRect(player.size/6, -player.size/8, player.size/12, player.size/12); }ctx.fillStyle = player.theme === "neo" ? "#ff007f" : "#000000"; ctx.fillRect(-player.size/8, player.size/8, player.size/4, 2);ctx.restore();requestAnimationFrame(gameLoop);}gameLoop();