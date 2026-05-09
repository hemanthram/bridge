import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import ReactEmoji from "react-emoji";
import ScrollToBottom from "react-scroll-to-bottom";
import queryString from "query-string";
import io from "socket.io-client";
import axios from "axios";
import { Trump } from "./Trump";
import { UserCards } from "./UserCards";
import { Game } from "./Game";
import { TargetChoose } from "./TargetChoose";
import { CardsOnTable } from "./CardsOnTable";
import { Winner } from "./Winner";
import { Link } from "react-router-dom";
import ChatBox from "./ChatBox/ChatBox";

const audioFile = require("../assets/juntos.mp3");
const audio = new Audio(audioFile);
const loadgif = require("../assets/loading.gif");

const suitSymbol = new Map();
suitSymbol.set("SPADES", <span className="suit">&spades;</span>);
suitSymbol.set("DIAMS", <span className="suit">&diams;</span>);
suitSymbol.set("CLUBS", <span className="suit">&clubs;</span>);
suitSymbol.set("HEARTS", <span className="suit">&hearts;</span>);

const calcScore = (tar: number, sco: number) => {
	if (sco < tar) return 10 * (sco - tar);
	else return 10 * tar + (sco - tar);
};

const ENDPOINT = (
	process.env.REACT_APP_API_URL || "https://bridge-twoz.onrender.com"
).replace(/\/$/, "");
let socket: SocketIOClient.Socket;
let tmp: any = null;
const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const Messages = () => {
	const [name, setName] = useState("");
	const [room, setRoom] = useState("");
	const [trumpHistory, setTrumpHistory] = useState<any[]>([{}]);
	const [usersinfo, setUsersInfo] = useState(tmp);
	const [id, setId] = useState(-1);
	const [cards, setCards] = useState<{ suit: string; value: string }[]>([]);
	const [trumpChoose, setTrumpChoose] = useState(false);
	const [trump, setTrump] = useState("");
	const [num, setNum] = useState(0);
	const [game, setGame] = useState(false);
	const [target, setTarget] = useState([-1, -1]);
	const [targetChoose, setTargetChoose] = useState(-1);
	const [trumpTurn, setTrumpTurn] = useState(1);
	const [trumpDone, setTrumpDone] = useState(false);
	const [trumpPlayer, setTrumpPlayer] = useState(-1);
	const [roundTurn, setRoundTurn] = useState(false);
	const [cardsOnRound, setCardsOnRound] = useState<any[]>([]);
	const [roundSuit, setRoundSuit] = useState("any");
	const [userLeft, setUserLeft] = useState(true);
	const [score, setScore] = useState([0, 0]);
	const [totScore, setTotScore] = useState([0, 0]);
	const [noOfGames, setNoOfGames] = useState(0);
	const [gameDone, setGameDone] = useState(false);
	const [allCards, setAllCards] = useState<any[]>([]);
	const [trumpMessage, setTrumpMessage] = useState<string>("");
	const [connectAgain, setConnectAgain] = useState(false);
	const [showChat, setShowChat] = useState(false);
	const [chat, setChat] = useState<string[]>([]);
	const [chatInput, setChatInput] = useState("");
	const [newMessage, setNewMessage] = useState(false);
	const [acusers, setAcusers] = useState<any[]>([]);
	const [matchDone, setMatchDone] = useState(false);

	useEffect(() => {
		return () => {
			socket.disconnect();
		};
	}, []);

	useEffect(() => {
		socket = io(ENDPOINT);
		const { name, room }: any = queryString.parse(window.location.search);
		setName(name);
		setRoom(room);
		socket.emit("join", name, room, async (error: any, opid: number) => {
			if (
				error === "Room Full, Please try other room" ||
				error === "Name exists in room, Try another name"
			) {
				console.log(error);
				alert(error);
				window.location.pathname = "/";
				return;
			}
			// console.log(opid)
			await axios.get(ENDPOINT + "?name=" + room).then(async (res) => {
				// console.log(res.data)
				let pid = opid;
				setCards(res.data.cards[pid]);
				setAllCards(res.data.allcards[pid]);
				setUsersInfo(res.data.usersinfo);
				setTrumpChoose(res.data.trumpTurn === pid);
				setTrump(res.data.trump);
				setNum(res.data.num);
				setTarget(res.data.target);
				setTargetChoose(res.data.targetChoose);
				setTrumpTurn(res.data.trumpTurn + 1);
				setTrumpPlayer(res.data.trumpPlayer);
				setRoundTurn(res.data.roundTurn === pid);
				setCardsOnRound(res.data.cardsOnRound);
				setRoundSuit(res.data.roundSuit);
				setScore(res.data.score);
				setNoOfGames(res.data.noOfGames);
				setTrumpDone(res.data.trumpDone);
				setGame(res.data.trumpDone);
				setTotScore(res.data.totScore);
				setAcusers(res.data.active);
				setTrumpHistory(res.data.trumpHistory);
				setTrumpMessage(res.data.trumpMessage);
				setChat(res.data.chat);
				setTargetChoose(res.data.targetChoose[pid]);
				setMatchDone(res.data.matchDone);
			});
			setId(opid);
		});
	}, [ENDPOINT]);

	useEffect(() => {
		if (chat.length === 0) return;
		if (!showChat) {
			if (!newMessage) setNewMessage(true);
		}
		audio.play();
	}, [chat]);

	useEffect(() => {
		if (!gameDone) return;
		setTrump("");
		setNum(1);
		setGame(false);
		setTrumpPlayer(-1);
		setTargetChoose(-1);
		setTrumpDone(false);
		let x = document.getElementById("historyBox");
		while (x?.hasChildNodes) x.removeChild(x.children[0]);
		setTrumpTurn(((noOfGames + 1) % 4) + 1);
		if (id === (noOfGames + 1) % 4) setTrumpChoose(true);
		else setTrumpChoose(false);
	}, [gameDone]);

	useEffect(() => {
		let c = 0;
		// console.log(acusers)
		for (let i = 0; i < acusers.length; i++) if (acusers[i].ac) c += 1;
		if (c == 4) setUserLeft(false);
		else setUserLeft(true);
	}, [acusers]);

	useEffect(() => {
		socket.on("connect_timeout", () => {
			console.log("connecion error1");
			setConnectAgain(true);
		});
		socket.on("reconnect_attempt", () => {
			console.log("connecion error2");
			setConnectAgain(true);
		});
		socket.once(
			"cards",
			(dcards: any, id: number | undefined, roomusers: any) => {
				setCards(dcards.slice(0, 13));
				setAllCards(dcards.slice(13));
				setUserLeft(false);
				if (id !== undefined) setId(id);
				if (roomusers) setUsersInfo(roomusers);
			}
		);
		socket.on(
			"trumpTurn",
			(
				playerid: number,
				trumpsuit: string,
				trumpvalue: string,
				pid: any,
				tmphis: any[]
			) => {
				if (playerid === id) setTrumpChoose(true);
				else setTrumpChoose(false);
				setTrump(trumpsuit);
				setNum(parseInt(trumpvalue) + 1);
				setTrumpHistory(tmphis);
				if (pid !== undefined) setTrumpPlayer(pid + 1);
				setTrumpTurn(playerid + 1);
			}
		);
		socket.on(
			"trumpDone",
			(
				finalTrump: string,
				targets: number[],
				pid: number,
				tmphis: any[]
			) => {
				setTrump(finalTrump);
				setTrumpHistory(tmphis);
				setTrumpPlayer(pid + 1);
				setTrumpChoose(false);
				setTarget(targets);
				setTrumpTurn(0);
				if (usersinfo)
					setTrumpMessage(
						`TRUMP DONE - ${
							usersinfo[pid].name
						} chose ${finalTrump} with ${targets[pid % 2]}`
					);
			}
		);
		socket.on("targetChoose", (t: number) => {
			if (t === id % 2) {
				setTargetChoose(0);
			} else setTargetChoose(2);
		});
		socket.on("targetSelectDone", (targets: number[]) => {
			setTarget(targets);
			setGame(true);
			setTrumpDone(true);
			setTrumpMessage("");
			setTrumpHistory([]);
			setTargetChoose(-1);
		});
		socket.on("roundTurn", (turn: number) => {
			if (turn === id) setRoundTurn(true);
			else setRoundTurn(false);
		});

		socket.on("roundStatus", (round: any, suitofround: string) => {
			setRoundSuit(suitofround);
			setCardsOnRound(round);
		});
		socket.on("chat", (chatMessage: string[]) => {
			setChat(chatMessage);
		});
		socket.on("userChange", (acusers: any) => {
			setAcusers(acusers);
		});

		if (score[0] + score[1] === 13 && !gameDone) {
			setTotScore([
				totScore[0] + calcScore(target[0], score[0]),
				totScore[1] + calcScore(target[1], score[1]),
			]);
			// if(noOfGames !== 7)
			setGameDone(true);
			// else
			// setMatchDone(true)
		}
	});

	const onTrump = (trumpSuit: string, trumpValue: string, pass: boolean) => {
		socket.emit("trumpPlay", trumpValue, trumpSuit, pass, room, id);
	};

	const onChoose = (tar: number) => {
		setTargetChoose(1);
		socket.emit("targetSelect", id, tar, room);
	};

	const handleDispatch = (val: string, suit: string) => {
		const filter = cards.filter((c) => {
			if (c.suit !== suit || c.value !== val) return c;
		});
		setCards(filter);
		socket.emit("round", room, id, val, suit);
		setRoundTurn(false);
	};

	const WinnerHandle = (winner: number) => {
		if (winner === id) socket.emit("roundDone", room, winner);
		if (winner % 2 === 1) setScore([score[0], score[1] + 1]);
		else setScore([score[0] + 1, score[1]]);
	};

	const closeModal = () => {
		if (noOfGames === 7) {
			setMatchDone(true);
			setGameDone(false);
			return;
		}
		setNoOfGames(noOfGames + 1);
		setCardsOnRound([]);
		setGameDone(false);
		setTarget([0, 0]);
		setScore([0, 0]);
		setCards(allCards.splice(0, 13));
		setRoundTurn(false);
		setRoundSuit("any");
	};

	const sendMessage = () => {
		setChatInput("");
		socket.emit("chat", chatInput, name, room);
	};

	return (
		<div className="full-game">
			<div className="game-header">
				<h1 className="hithere">Hi {name ? name : "There"}</h1>
				{id != -1 && (
					<h2 className="playerID">You are Player no. {id + 1}</h2>
				)}
				<h1 className="room">Room: {room}</h1>
				<button
					className={"chat-open" + (newMessage ? " unread" : "")}
					onClick={(e) => {
						e.preventDefault();
						setShowChat(true);
						setNewMessage(false);
					}}
				>
					{newMessage && <span>&bull; </span>}Chat Room
				</button>
				<a href="/rules" target="_blank" className="rules">
					Rules ?
				</a>
			</div>
			<div className="game">
				<div className="game-left">
					{usersinfo && (
						<div>
							<div
								className={
									"room-details" + (showChat ? " hide" : "")
								}
							>
								{game && (
									<Game
										trump={trump}
										target={target}
										score={score}
									/>
								)}
								<div className="team-details td">
									<div className="teams-heading">
										<h3>Teams in Room</h3>
									</div>
									<div className="teams">
										<div className="team1">
											<p className="team-name">Team 1</p>
											<p>
												Player 1 - {usersinfo[0].name}
											</p>
											<p>
												Player 3 - {usersinfo[2].name}
											</p>
										</div>
										<div className="team2">
											<p className="team-name">Team 2</p>
											<p>
												{usersinfo[1].name} - Player 2
											</p>
											<p>
												{usersinfo[3].name} - Player 4
											</p>
										</div>
									</div>
								</div>
								<div className="score-and-games">
									<div className="team-details scores">
										<div className="teams-heading">
											<h3>Total Scores</h3>
										</div>
										<div className="teams">
											<div className="team1">
												<p className="score-team-name">
													Team 1
												</p>
												<p className="score-score">
													{totScore[0]}
												</p>
											</div>
											<div className="team2">
												<p className="score-team-name">
													Team 2
												</p>
												<p className="score-score">
													{totScore[1]}
												</p>
											</div>
										</div>
									</div>
									<div className="noofgames">
										<div className="noofgames-heading">
											<h3>Games Played</h3>
										</div>
										<div className="noofgames-result">
											<p>{noOfGames}</p>
										</div>
									</div>
								</div>
							</div>

							<div
								className={
									"chat-room room-details" +
									(!showChat ? " hide" : "")
								}
							>
								<ChatBox
									chat={chat}
									sendMessage={sendMessage}
									chatInput={chatInput}
									setChatInput={setChatInput}
									setShowChat={setShowChat}
									user={name}
									acusers={acusers}
									usersinfo={usersinfo}
								/>
							</div>
						</div>
					)}

					{cards.length >= 1 && (
						<UserCards
							cards={cards}
							game={roundTurn}
							handleDispatch={handleDispatch}
							roundSuit={roundSuit}
							round={trumpDone}
						/>
					)}
					<div>
						{cardsOnRound.length > 0 && (
							<CardsOnTable
								cards={cardsOnRound}
								users={usersinfo}
							/>
						)}
						{cardsOnRound.length === 4 && (
							<Winner
								cards={cardsOnRound}
								trump={trump}
								call={WinnerHandle}
								check={gameDone}
							/>
						)}
					</div>
				</div>

				<div
					className={
						"trump-section" + (game ? " trump-section-disable" : "")
					}
				>
					{id !== -1 && !game && (
						<div id="historyBox" className="history-box">
							<div className="teams-heading">
								<h3>Trump History</h3>
							</div>
							<ScrollToBottom className="trump-box">
								{trumpHistory &&
									trumpHistory.map((his, id) => {
										return his.name === name ? (
											<div className="trump-message-box">
												<p className="y-trump-player-no">
													Your turn
												</p>
												<p className="y-trump-message">
													<span className="y-trump-player-name">
														{his.name}
													</span>
													{his.pass ? (
														<span>
															{" "}
															{his.value},
															{his.suit}
															<span className="suit-symbol">
																{" "}
																{suitSymbol.get(
																	his.suit
																)}
															</span>
														</span>
													) : (
														<span> PASS</span>
													)}
												</p>
											</div>
										) : (
											<div className="trump-message-box">
												<p className="trump-message">
													<span className="trump-player-name">
														{his.name}
													</span>
													{his.pass ? (
														<span>
															{" "}
															{his.value},
															{his.suit}
															<span className="suit-symbol">
																{" "}
																{suitSymbol.get(
																	his.suit
																)}
															</span>
														</span>
													) : (
														<span> PASS</span>
													)}
												</p>
												<p className="trump-player-no">
													Player {his.id + 1}
												</p>
											</div>
										);
									})}
							</ScrollToBottom>
							<div id="trump-box1" className="trump-box">
								{trumpMessage !== "" && (
									<div className="final-trump-message-box">
										<p className="trump-message">
											{trumpMessage}
										</p>
									</div>
								)}
							</div>
							{trumpTurn !== 0 &&
								(trumpTurn - 1 === id ? (
									<div className="teams-heading turn-box-y">
										<p className="trump-message">
											Your Turn
										</p>
									</div>
								) : (
									<div className="teams-heading turn-box-o">
										<p className="trump-message">
											Player {trumpTurn}'s Turn
										</p>
									</div>
								))}
						</div>
					)}
					{targetChoose === -1 && !game && trump && (
						<div className="current-trump">
							<p className="current-trump-suit">
								Current Trump : {trump}
							</p>
							<p className="current-trump-player">
								Trump Placed By Player {trumpPlayer}
							</p>
						</div>
					)}
					{targetChoose !== -1 && (
						<TargetChoose
							handleSubmit={onChoose}
							op={targetChoose}
							trump={trump}
						/>
					)}
					{trumpChoose && (
						<Trump num={num} handleSubmit={onTrump} trump={trump} />
					)}
				</div>
			</div>
			<Modal isOpen={gameDone} ariaHideApp={false}>
				<div className="modal">
					<h3 className="modal-head">Results of Game</h3>
					<h5>Targets for teams :</h5>
					<p>
						Team 1 : {target[0]} , Team 2 : {target[1]}
					</p>
					<h5>Scores of Teams :</h5>
					<p>
						Team 1 : {score[0]} , Team 2 : {score[1]}
					</p>
					<h5>Total Scores</h5>
					<p>
						Team 1 : {totScore[0]} , Team 2 : {totScore[1]}
					</p>
					<button
						onClick={(e) => {
							// console.log(cards);
							closeModal();
						}}
					>
						Next Game !!!
					</button>
				</div>
			</Modal>

			<Modal isOpen={userLeft} ariaHideApp={false}>
				{acusers.length === 0 && (
					<div className="room-status">
						<h2>Fetching Data .... </h2>
						<img src={loadgif} height="160px" width="240px"></img>
					</div>
				)}
				{acusers.length > 0 && acusers.length < 4 && (
					<div className="room-status">
						<h1 className="acusers">Room Status</h1>
						{acusers.map((user) => {
							return (
								<p className={user.ac ? "online" : "offline"}>
									{user.name}
								</p>
							);
						})}
						<p className="room-status-info">
							Waiting for {4 - acusers.length} more people to join
							the room ..
						</p>
						<img src={loadgif} height="160px" width="240px"></img>
					</div>
				)}
				{acusers.length === 4 && (
					<div className="room-status">
						<h1 className="acusers">Room Status</h1>
						{acusers.map((user) => {
							return (
								<p className={user.ac ? "online" : "offline"}>
									{user.name}
								</p>
							);
						})}
						<p className="room-status-info">
							Some of your friends ( in red ) had a connection
							problem .. please wait while they reconnect again ..
						</p>
						<img src={loadgif} height="160px" width="240px"></img>
					</div>
				)}
			</Modal>
			<Modal isOpen={connectAgain} ariaHideApp={false}>
				<p className="user-left-p">Connection lost, Login again</p>
				<Link to="/">Login here</Link>
			</Modal>
			<Modal isOpen={matchDone} ariaHideApp={false}>
				<div className="modal">
					<h3 className="modal-head">Results of Match</h3>
					<h5>Total Scores</h5>
					{usersinfo && (
						<div>
							<p>
								Team 1 : {totScore[0]}
								<br />( {usersinfo[0].name} ,{" "}
								{usersinfo[2].name} )
							</p>
							<p>
								Team 2 : {totScore[1]}
								<br />( {usersinfo[1].name} ,{" "}
								{usersinfo[3].name} )
							</p>
						</div>
					)}
					<h1 className="match-winner">
						{totScore[0] > totScore[1]
							? "Team 1 Wins !!"
							: totScore[0] === totScore[1]
							? "Match Draw !!"
							: "Team 2 Wins"}
					</h1>
					<p className="match-info">
						Hope you enjoyed the game .. You can play another match
						with your friends by logging in again in a new room ..
						Have fun !!
					</p>
				</div>
			</Modal>
		</div>
	);
};
