//NEED TO RUN THIS ./bin/server.exe ORIGIN_ALLOWED=http://localhost:3000

// The store will hold all information needed globally
var store = {
    track_id: undefined,
    player_id: undefined,
    race_id: undefined,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    onPageLoad()
    setupClickHandlers()
})

async function onPageLoad() {
    try {
        getTracks()
            .then(tracks => {
                const html = renderTrackCards(tracks)
                renderAt('#tracks', html)
            })

        getRacers()
            .then((racers) => {
                const html = renderRacerCars(racers)
                renderAt('#racers', html)
            })
    } catch (error) {
        console.log(error.message)
        console.error(error)
    }
}

function setupClickHandlers() {
    document.addEventListener('click', function(event) {
        const {
            target
        } = event

        // Race track form field
        if (target.matches('.card.track')) {
            handleSelectTrack(target)
        }

        // Podracer form field
        if (target.matches('.card.podracer')) {
            handleSelectPodRacer(target)
        }

        // Submit create race form
        if (target.matches('#submit-create-race')) {
            event.preventDefault()

            // start race
            handleCreateRace()
        }

        // Handle acceleration click
        if (target.matches('#gas-peddle')) {
            handleAccelerate(target)
        }

    }, false)
}

async function delay(ms) {
    try {
        return await new Promise(resolve => setTimeout(resolve, ms));
    } catch (error) {
        console.log("an error shouldn't be possible here")
        console.log(error)
    }
}

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
    try {
        const playerid = store.player_id
        const trackid = store.track_id
        //throw an error if no
        if (!trackid || !playerid) {
            alert(`Please, select a track and racer`);
            throw new Error('Need to choose a tree and track');
        }
        // const race = TODO - invoke the API call to create the race, then save the result
        const race = new Promise((resolve, reject) => {
                resolve(createRace(playerid, trackid))
                return data
            })
            .then((data) => {
                // render starting UI
                renderAt('#race', renderRaceStartView(data.Track, data.PlayerID))
                return data
            })
            .then((data) => {
                // TODO - update the store with the race id
                store.race_id = data.ID - 1
                return data
            })
            .catch((error) => {
                console.log(error)
                alert(error);
            })
        // The race has been created, now start the countdown
        // TODO - call the async function runCountdown
        race.then(await runCountdown())
        startRace(store.race_id)
        runRace(store.race_id)
    } catch (err) {
        console.log(`Could not create a race. ${err}.`)
    }
}

function runRace(raceID) {
    return new Promise(resolve => {

        async function checkStatus() {
            try {
                let res = await getRace(store.race_id);
                // Function to finish the race when anyone hits a given number of segments, otherwisethe race is long and hard to test
                const checklength = (n) => {
                    res.positions.forEach(element => {
                        if (element.segment > n) {
                            res.status = 'finished'
                        }
                    })
                }
                // Calling the function is optional. For default race lengths, comment out or delete the next function call. 
                checklength(20)

                if (res.status === 'in-progress') {
                    renderAt('#leaderBoard', raceProgress(res.positions));
                } else {
                    clearInterval(raceInfo); // to stop the interval from repeating
                    renderAt('#race', resultsView(res.positions)); // to render the results view
                    resolve(res); // resolve the promise
                }
            } catch (error) {
                console.log(error);
            }
        }
        const raceInfo = setInterval(checkStatus, 500);
    })

}

async function runCountdown() {
    try {
        // wait for the DOM to load
        await delay(1000)
        let timer = 3
        return new Promise(resolve => {
            // use Javascript's built in setInterval method to count down once per second
            const update = () => {
                // run this DOM manipulation to decrement the countdown for the user
                document.getElementById('big-numbers').innerHTML = --timer
                if (timer === 0) {
                    // if the countdown is done, clear the interval, resolve the promise, and return
                    document.getElementById('big-numbers').innerHTML = "Go!"
                    clearInterval(countdown)
                    resolve()
                }
            }
            const countdown = setInterval(update, 1000);



        })
    } catch (error) {
        console.log(error);
    }
}

function handleSelectPodRacer(target) {

    // remove class selected from all racer options
    const selected = document.querySelector('#racers .selected')
    if (selected) {
        selected.classList.remove('selected')
    }

    // add class selected to current target
    target.classList.add('selected')

    // TODO - save the selected racer to the store
    store.player_id = target.id //this could be handled more functionally 
}

function handleSelectTrack(target) {
    // remove class selected from all track options
    const selected = document.querySelector('#tracks .selected')
    if (selected) {
        selected.classList.remove('selected')
    }
    // add class selected to current target
    target.classList.add('selected')

    // TODO - save the selected track id to the store
    store.track_id = target.id
}

function handleAccelerate() {
    accelerate(store.race_id)
}

// HTML VIEWS ------------------------------------------------

function renderRacerCars(racers) {
    if (!racers.length) {
        return `
			<h4>Loading Trees...</4>
		`
    }

    const results = racers.map(renderRacerCard).join('')

    return results
}

function renderRacerCard(racer) {
    const {
        id,
        driver_name,
        top_speed,
        acceleration,
        handling
    } = racer

    return `
		<li class="card podracer" id="${id}">
			<h3>Species:<br> ${driver_name}</h3>
			<p>Speed: ${top_speed}</p>
			<p>Acceleration: ${acceleration}</p>
			<p>Handling: ${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
    if (!tracks.length) {
        return `
			<h4>Loading Tracks...</h4>
		`
    }

    const results = tracks.map(renderTrackCard).join('')

    return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {

    const {
        id,
        name,
        segments
    } = track

    return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
			<p>Length: ${Math. round(segments.length/2)-1}/100</p>
		</li>
	`
}

function renderCountdown(count) {
    return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {
    return `
		<header>
		<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>
			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your tree run faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
    positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

    return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
    let userPlayer = positions.find(e => e.id === parseInt(store.player_id))
    userPlayer.driver_name += " (you)"

    positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
    let count = 1

    const results = positions.map(p => {
        return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
    })

    return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`
}

function renderAt(element, html) {
    const node = document.querySelector(element)

    node.innerHTML = html
}

// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
    return {
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': SERVER,
        },
    }
}

// Fetch call (with error handling!) to each of the following API endpoints 

async function getTracks() {
    return fetch(`${SERVER}/api/tracks`, {
            ...defaultFetchOpts(),
        })
        .then(res => res.json())
        .catch(err => console.log(err));
}

function getRacers() {
    // GET request to `${SERVER}/api/cars`
    return fetch(`${SERVER}/api/cars`, {
            ...defaultFetchOpts(),
        })
        .then(response => response.json())
        .catch(err => console.log(err));
}


async function createRace(player_id, track_id) {
    player_id = parseInt(player_id)
    track_id = parseInt(track_id)
    const body = {
        player_id,
        track_id
    }

    return fetch(`${SERVER}/api/races`, {
            method: 'POST',
            ...defaultFetchOpts(),
            dataType: 'jsonp',
            body: JSON.stringify(body)
        })
        .then(res => res.json())
        .catch(err => console.log(err))
}

function getRace(id) {
    // GET request to `${SERVER}/api/races/${id}`
    return fetch(`${SERVER}/api/races/${id}`, {
            ...defaultFetchOpts(),
        })
        .then(response => response.json())
        .catch(err => console.log(err));
}

async function startRace(id) {
    return fetch(`${SERVER}/api/races/${id}/start`, {
            method: 'POST',
            ...defaultFetchOpts(),
        })
        .catch(err => console.log(err))
}

function accelerate(id) {
    return fetch(`${SERVER}/api/races/${id}/accelerate`, {
            method: 'POST',
            ...defaultFetchOpts(),
        })
        .catch(err => console.log(err))
}