import { createServer } from "http";
import express from "express";
import socketio from "socket.io";
import cors from "cors";
import {
  addUser,
  startGame,
  trumpPlay,
  getTrump,
  getTarget,
  setTarget,
  updateRound,
  getTurn,
  getRound,
  getRoundSuit,
  removeRoom,
  resetRoom,
  calcScore,
  idofuser,
  getActive
} from "./game";
import { user, local } from "./setting";

const suitSymbol = new Map();
suitSymbol.set("SPADES", "&spades;");
suitSymbol.set("DIAMS", "&diams;");
suitSymbol.set("CLUBS", "&clubs;");
suitSymbol.set("HEARTS", "&hearts;");

interface Hash {
  [details: string] : string;
} 
interface Hash1 {
  [details: string] : local;
} 

let socketroom:Hash = {};
let socketname:Hash = {};
let storeroom:Hash1 = {};

const PORT = Number(process.env.PORT) || 8080;
const clientOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
const app = express();
const server = createServer(app);
const io = socketio(server).listen(server, {pingInterval:10000, pingTimeout:5000});
if (clientOrigins.length > 0) {
  io.origins(clientOrigins);
}
io.on("connect", async (socket) => {
  // console.log(acusers);

  socket.on("join", (name: string, room: string, callback) => {
    let res = addUser(name, room, socket.id);
    console.log("join",name,room,res)
    if (res === -1) {
      return callback("Room Full, Please try other room");
    }
    if (res === -2) {
      io.to(room).emit("userChange", getActive(room))
      socketroom[socket.id] = room
      socketname[socket.id] = name
      socket.join(room)
      let x = idofuser(room, name)
      return callback("Rejoin",x)
    }
    if(res === -3) {
      return callback("Name exists in room, Try another name")
    }
    socket.join(room);
    socketname[socket.id] = name
    socketroom[socket.id] = room
    if (res === 4) {
      let users: user[] = startGame(room);
      for (let i = 0; i < 4; ++i)
        io.to(users[i].id).emit("cards", users[i].cards, i, users);
      let tur = getTurn(room)
      storeroom[room] = {
        usersinfo: users.map((user) => {return {name:user.name}}),
        trumpTurn: tur,
        trump: "NO TRUMP",
        num: 1,
        target: [-1,-1],
        roundTurn: -1,
        cardsOnRound: [],
        roundSuit: "any",
        score: [0,0],
        noOfGames: 0,
        trumpPlayer: -1,
        rounds: 0,
        trumpDone: false,
        cards: users.map((user) => {return user.cards.slice(0,13)}),
        allcards: users.map((user) => {return user.cards.slice(13)}),
        totScore: [0,0],
        chat: [],
        trumpHistory:[],
        trumpMessage: "",
        targetChoose: [-1,-1,-1,-1],
        matchDone: false
      }
      io.to(room).emit("trumpTurn", tur, "", "0");
    }
    else {
      io.to(room).emit("userChange", getActive(room))
    }
  });

  socket.on(
    "trumpPlay",
    (
      trumpvalue: string,
      trumpsuit: string,
      pass: boolean,
      room: string,
      id: any
    ) => {
      console.log(room, id, trumpsuit, trumpvalue, pass);
      let nxtturn = trumpPlay(trumpvalue, trumpsuit, pass, room);
      let tru = getTrump(room)
      storeroom[room].trump = tru
      storeroom[room].trumpHistory.push({suit:trumpsuit, value:trumpvalue, pass, name:storeroom[room].usersinfo[id].name, id})
      if (nxtturn === -1) {
        let tar = getTarget(room);
        storeroom[room].trump = tru
        storeroom[room].trumpPlayer = getTurn(room)+1
        storeroom[room].trumpTurn = -1
        storeroom[room].target = tar 
        storeroom[room].trumpMessage = `
        TRUMP DONE - ${storeroom[room].usersinfo[id].name} chose ${tru} with ${tar[id%2]}
        `
        io.to(room).emit("trumpDone", tru, tar, getTurn(room), storeroom[room].trumpHistory);
        let tc = ( tar[0] === 0 ) ? 0 : 1
        storeroom[room].targetChoose[tc] = 0
        storeroom[room].targetChoose[tc+2] = 0
        storeroom[room].targetChoose[tc+1] = 2
        storeroom[room].targetChoose[(tc+3)%4] = 2
        io.to(room).emit("targetChoose", tc);
        return;
      }
      storeroom[room].trumpTurn = nxtturn
      storeroom[room].num = parseInt(trumpvalue)+1
      console.log(storeroom[room].num)
      if (pass) {
        storeroom[room].trumpPlayer = id+1;
        io.to(room).emit("trumpTurn", nxtturn, tru, trumpvalue, id, storeroom[room].trumpHistory);
      }
      else {
        io.to(room).emit("trumpTurn", nxtturn, tru, trumpvalue, undefined, storeroom[room].trumpHistory);
      }
    }
  );

  socket.on("targetSelect", (id: number, tar: number, room: string) => {
    storeroom[room].targetChoose[id] = 1
    if (setTarget(id, tar, room)) {
      io.to(room).emit("targetSelectDone", getTarget(room));
      storeroom[room].targetChoose = [-1,-1,-1,-1]
      storeroom[room].trumpDone = true
      storeroom[room].target = getTarget(room)
      io.to(room).emit("roundTurn", getTurn(room))
      storeroom[room].roundTurn = getTurn(room)
    }
  });
  socket.on("round", (room: string, id: number, val: string, suit: string) => {
    let nxtturn = updateRound(room, id, val, suit);
    let round = getRound(room)
    storeroom[room].roundSuit = round.length === 4 ? "any":getRoundSuit(room)
    storeroom[room].cardsOnRound = round
    storeroom[room].cards[id] = storeroom[room].cards[id].filter ((c) => {
      if(c.suit !== suit || c.value !== val) return true;
      return false
    })
    io.to(room).emit("roundStatus", round, round.length === 4 ? "any":getRoundSuit(room))
    if (nxtturn === -1) {
      // const result = winner(room);
      // io.to(room).emit("roundDone", result);
      // io.to(room).emit("roundTurn", result)
    } else {
      storeroom[room].roundTurn = nxtturn
      io.to(room).emit("roundTurn", nxtturn);
    }
  });
  socket.on("roundDone", (room, winner) => {
    resetRoom(room, winner)
    storeroom[room].roundTurn = winner
    storeroom[room].rounds += 1
    storeroom[room].score[winner%2] += 1
    if(storeroom[room].rounds === 13) {
      storeroom[room].trumpDone = false
      storeroom[room].rounds = 0
      storeroom[room].noOfGames += 1
      storeroom[room].cardsOnRound = []
      storeroom[room].totScore[1] += calcScore(storeroom[room].target[1], storeroom[room].score[1])
      storeroom[room].totScore[0] += calcScore(storeroom[room].target[0], storeroom[room].score[0])
      storeroom[room].target = [0,0]
      storeroom[room].score = [0,0]
      storeroom[room].roundTurn = -1
      storeroom[room].roundSuit = "any"
      storeroom[room].trump = ""
      storeroom[room].num = 1
      storeroom[room].trumpPlayer = -1
      storeroom[room].trumpTurn = (storeroom[room].noOfGames%4)
      for(let i=0; i<4; ++i) 
      storeroom[room].cards[i] = storeroom[room].allcards[i].splice(0,13)
      storeroom[room].trumpHistory = []
      storeroom[room].trumpMessage = ""
    }
    if(storeroom[room].noOfGames === 8) {
      storeroom[room].matchDone = true
    }
    io.to(room).emit("roundTurn", winner)
  })
  socket.on("chat", (message:string, name:string, room:string) => {
    console.log("chat", room, ":" , name, message)
    storeroom[room].chat.push(`${name}$${message}`)
    io.to(room).emit("chat", storeroom[room].chat)
  })
  socket.on("disconnect", () => {
    let tmp = socketroom[socket.id]
    let tmpname = socketname[socket.id]
    console.log("left", tmpname, socketroom[socket.id])
    if(tmp) {
      if(removeRoom(tmp,tmpname)) 
      { delete storeroom[tmp]; }
      else {
        io.to(tmp).emit('userChange', getActive(tmp))
      }
      delete socketname[socket.id]
      delete socketroom[socket.id]
    }
  });
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
if (clientOrigins.length > 0) {
  app.use(cors({ origin: clientOrigins, credentials: true }));
} else {
  app.use(cors());
}

app.get("/", (req,res) => {
  console.log(req.hostname, req.query)
  // console.log(getActive(String(req.query.name)))
  res.send({...storeroom[String(req.query.name)], active:getActive(String(req.query.name))})
})
app.get("/test", (req,res) => {
  console.log("test", req.hostname)
  res.send("Done")
})


server.listen(PORT, () =>
  console.log(`Server has started on ${PORT}`)
);
