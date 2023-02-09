import React, {useEffect, useState} from 'react';
import exp from "constants";

enum SubjectType {
  fs, ss, ts, fp, sp, tp
}

type Subject = {
  display: string
  fem: boolean
  type: SubjectType
}

const subjects: Subject[] = [
  {display: "je", fem: false, type: SubjectType.fs},
  {display: "tu", fem: false, type: SubjectType.ss},
  {display: "il", fem: false, type: SubjectType.ts},
  {display: "on", fem: false, type: SubjectType.ts},
  {display: "elle", fem: true, type: SubjectType.ts},
  {display: "nous", fem: false, type: SubjectType.fp},
  {display: "vous", fem: false, type: SubjectType.sp},
  {display: "ils", fem: false, type: SubjectType.tp},
  {display: "elles", fem: true, type: SubjectType.tp},
]

const mainClauses: string[] = [
  "demander",
  "desirer",
  "exiger",
  "preferer",
  "proposer",
  "recommander",
  "souhaiter",
  "suggerer",
  "vouloir",
  "aimer",
  "avoir peur",
  "etre content",
  "etre désolé",
  "etre étonné",
  "etre fâché",
  "être ravi",
  "regretter"
]

enum ConjType {
  inf, sub, ind
}

const subTypeToEnglish = [
  "I",
  "You",
  "HeSheIt",
  "We",
  "YouAll",
  "They",
]

const subLen = [
  3, 3, 11, 5, 5, 9
]

async function conjugate(verb: string, subj: Subject, type: ConjType): Promise<string> {
  let adj: string = ""
  if (verb.includes(" ")) {
    adj = verb.substring(verb.indexOf(" "))
    verb = verb.substring(0, verb.indexOf(" "))
  }

  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': 'd38e07b734mshc8412da9f314e69p12532djsn2b4af091c918',
      'X-RapidAPI-Host': 'french-conjugaison.p.rapidapi.com'
    }
  };

  let f = await fetch(`https://french-conjugaison.p.rapidapi.com/conjugate/${verb.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`, options)
  let js = await f.json()
  let s: string = ""
  switch (type) {
    case ConjType.sub: {
      s = js.data.subjonctif.present[`subjonctifPresent${subTypeToEnglish[subj.type]}`]
      if (s.includes("que")) {
        s = s.substring(4)
      } else {
        s = s.substring(3)
      }
      if (s.includes("'")) {
        s = " " + s;
      }
      s = s.substring(subLen[subj.type])
      if (s.includes("/")) {
        s = s.substring(0, s.indexOf("/"))
      }
      break
    }
    case ConjType.ind: {
      s = js.data.indicatif.present[`indicatifPresent${subTypeToEnglish[subj.type]}`]
      if (s.includes("'")) {
        s = " " + s;
      }
      s = s.substring(subLen[subj.type])
      if (s.includes("/")) {
        s = s.substring(0, s.indexOf("/"))
      }
      break
    }
    case ConjType.inf: {
      s = js.data.word
      break
    }
  }
  if (adj.length !== 0) {
    s += adj
    if (subj.fem)
      s += 'e'
  }
  return s
}

type Sentence = {
  begin: string
  negate2nd: boolean
  expected: string
  asking: string
}

async function getSentence(verbs: string[]) : Promise<Sentence> {
  await new Promise(resolve => setTimeout(resolve, 1500))
  let sub = subjects[Math.floor(Math.random() * subjects.length)]
  let verb = await conjugate(mainClauses[Math.floor(mainClauses.length * Math.random())], sub, ConjType.ind)
  let sentence = ""
  if ((verb[0] === 'a' || verb[0] === 'u' || verb[0] === 'e' || verb[0] === 'i') && sub.display === "je") {
    sentence += "j'"
  } else {
    sentence += sub.display + " "
  }
  await new Promise(resolve => setTimeout(resolve, 1500))
  sentence += verb
  sentence += " "
  let negate: boolean = Math.random() > 0.5
  let asking: string = ""
  let expected: string = ""
  let sub2 = subjects[Math.floor(Math.random() * subjects.length)]
  if (sub2.display === sub.display) {
    sentence += "de {verb here}"
    asking = verbs[Math.floor(verbs.length * Math.random())]
    expected = await conjugate(asking, sub2, ConjType.inf)
    if (negate) expected = "ne pas " + expected
  } else {
    let fc = sub2.display[0]
    if (fc === 'i' || fc === 'e' || fc === 'o') sentence += " qu'"
    else sentence += " que "
    sentence += sub2.display + " {verb here}"
    asking = verbs[Math.floor(verbs.length * Math.random())]
    expected = await conjugate(asking, sub2, ConjType.sub)
    if (negate) {
      let begin = ""
      if (expected[0] === "u" || expected[0] === "i" || expected[0] === "e" || expected[0] === "a" || expected[0] === "o") {
        begin = "n'"
      } else {
        begin = "ne "
      }
      expected = begin + expected
      expected += " pas"
    }
  }
  return {begin: sentence, asking: asking, expected: expected, negate2nd: negate}
}

function App() {
  const [sentence, setSentence] = useState({} as unknown as Sentence)
  const [update, setUpdate] = useState(1)
  const [ans, setAns] = useState("")
  const [showAns, setShowAns] = useState(false)

  useEffect(() => {
    (async () => {
      let f = await fetch("vb.txt")
      let txt = await f.text()
      let split = txt.split("\r\n")
      let verbs = split.map(it => it.substring(0, it.indexOf(" –")).trim())
      verbs.pop()
      setSentence(await getSentence(verbs))
    })()
  }, [update])

  return (
    <div className="App">
      {sentence.begin}
      <br/>
      {sentence.asking}
      <br/>
      {sentence.negate2nd ? "negate" : "don't negate"}
      <br/>
      <input value={ans} onChange={it => setAns(it.target.value)}/>
      <button onClick={() => setShowAns(true)}>done!</button>
      {showAns && <div style={{backgroundColor: (sentence.expected.trim() === ans.trim() ? "#90EE90" : "#FFCCCB")}}>{`got ${ans}, expected ${sentence.expected}`}</div>}
      {showAns && <button onClick={() => {
        setUpdate(update + 1)
        setShowAns(false)
        setAns("")
      }}>go again!</button>}
    </div>
  );
}

export default App;
