const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const jsdom = require('jsdom');
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => { console.log('Listening on port', PORT); });

app.use(express.urlencoded({ extended: true }));



app.get('/', async (req, res) => {

    try {

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox'],
            executablePath: "./node_modules/chromium/lib/chromium/chrome-linux/chrome",
            waitUntil: "domcontentloaded"
        });

        const page = await browser.newPage();
        const response = await page.goto('https://www.promiedos.com.ar/', {
            waitUntil: 'load'
        });
        const body = await response.text();
        const { window: { document } } = new jsdom.JSDOM(body);


        let arr = Array.from(document.querySelectorAll('tr')).filter(item => item.className != "choy" && item.id != "" || item.className == "diapart" || item.className === "tituloin")
        let dia = ""
        let liga = ""
        let partidos = []

        arr.forEach((e, index) => {
            if (e.className === "diapart") {
                dia = e.children[0].textContent

            } else if (e.className === "tituloin") {
                liga = e.children[0].textContent.trim()

            } else if (e.className != "goles") {

                partidos.push({
                    dia: dia === "" ? "Hoy" : dia,
                    liga: liga === "" ? document.querySelector("#titulos")?.textContent.trim() : liga,
                    estado: getEstado(e.children[0]),
                    cronometro: e.children[0].textContent.trim(),
                    local: e.children[1].textContent,
                    escudo_local: e.children[1].children[0].src,
                    goles_local: e.children[2].textContent,
                    rojas_local: e.children[2].querySelectorAll(".roja")?.length,
                    visitante: e.children[4].textContent,
                    escudo_visitante: e.children[4].children[0].src,
                    goles_visitante: e.children[3].textContent,
                    rojas_visitante: e.children[3].querySelectorAll(".roja")?.length,
                    ficha: e.children[5].querySelector('a')?.href,
                    autores_local: getAutores(arr[index + 1].children[0]),
                    autores_visitante: getAutores(arr[index + 1].children[1]),

                })
            }
        })

        

        res.json(partidos)

    }
    catch (error) { console.log(error) }

});




function getAutores(e) {
    let autoresTexto = e?.textContent.slice(0, -2)

    if (autoresTexto === '' || autoresTexto === undefined) {
        return []
    } else {
        let goles_arr = []
        autoresTexto.split(";").forEach(gol => {
            let gol_info = gol.split('\'')


            goles_arr.push({
                minuto: gol_info[0].trim(),
                autor: gol_info[1].trim()
            })

        })
        return goles_arr
    }

}


function getEstado(e) {
    let className = e.className
    if (className === "game-play") {
        return "jugando"
    } else if (className === "game-time") {
        return "no empezado"
    } else if (className === "game-fin") {
        return "finalizado"
    } else if (className === "game-sus") {
        return "suspendido"
    }
}


