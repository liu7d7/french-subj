import React, {useEffect, useState} from 'react';

enum SubjectType {
  fs, ss, ts, fp, sp, tp
}

let conjugations: any = null

async function getConjugations(): Promise<any> {
  if (conjugations == null) {
    let f = await fetch(`${window.location}/vbs.json`)
    conjugations = await f.json()
  }
  return conjugations
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

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

async function conjugate(verb: string, subj: Subject, type: ConjType): Promise<string> {
  let adj: string = ""
  if (verb.includes(" ")) {
    adj = verb.substring(verb.indexOf(" "))
    verb = verb.substring(0, verb.indexOf(" "))
  }

  let s: string = ""
  let js = (await getConjugations())[removeAccents(verb)]
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
  return trim(s)
}

type Sentence = {
  begin: string
  negate2nd: boolean
  expected: string
  asking: string
}

function startsVowel(str: string): boolean {
  str = trim(str)
  str = removeAccents(str)
  return str.startsWith("a") || str.startsWith("e") ||str.startsWith("i") ||str.startsWith("o") ||str.startsWith("u") || str.startsWith("ha")
}

function adjustSubjOrPreposition(str: string, nextVowel: boolean): string {
  if ((str.endsWith("e") || str.endsWith("a")) && str !== "elle" && nextVowel) {
    str = str.substring(0, str.length - 1)
    str += "'"
  } else {
    str += " "
  }
  return str
}

async function getSentence(verbs: string[]) : Promise<Sentence> {
  let sub = subjects[Math.floor(Math.random() * subjects.length)]
  let verb = await conjugate(mainClauses[Math.floor(mainClauses.length * Math.random())], sub, ConjType.ind)
  let sentence = ""
  sentence += adjustSubjOrPreposition(sub.display, startsVowel(verb))
  sentence += verb
  sentence += " "
  let negate: boolean = Math.random() > 0.5
  let asking: string
  let expected: string
  let sub2 = subjects[Math.floor(Math.random() * subjects.length)]
  if (sub2.display === sub.display) {
    asking = verbs[Math.floor(verbs.length * Math.random())]
    expected = await conjugate(asking, sub2, ConjType.inf)
    sentence += adjustSubjOrPreposition("de", startsVowel(expected) && !negate)
    if (negate) expected = "ne pas " + expected
  } else {
    if (startsVowel(sub2.display)) sentence += " qu'"
    else sentence += " que "
    asking = verbs[Math.floor(verbs.length * Math.random())]
    expected = await conjugate(asking, sub2, ConjType.sub)
    sentence += adjustSubjOrPreposition(sub2.display, startsVowel(expected) && !negate)
    if (negate) {
      let begin: string = adjustSubjOrPreposition("ne", startsVowel(expected))
      expected = begin + expected
      expected += " pas"
    }
  }
  return {begin: sentence, asking: asking, expected: expected, negate2nd: negate}
}

let verbs = [] as string[]
async function getVerbs(): Promise<string[]> {
  if (verbs.length === 0) {
    let f = await fetch(`${window.location}/vb.txt`)
    let txt = await f.text()
    let split: string[] = txt.split(/[\r\n]+/)
    verbs = split.map(function(it) {return it.substring(0, it.indexOf(" –")).trim()})
  }
  return verbs
}

const loading: string = "loading..."

function trim(str: string): string {
  str = str.trim()
  while (str.includes("  "))
    str = str.replace("  ", " ")
  return str
}

function App() {
  const [sentence, setSentence] = useState({} as unknown as Sentence)
  const [ans, setAns] = useState("")
  const [showAns, setShowAns] = useState(false)

  async function redo() {
    setSentence(await getSentence(await getVerbs()))
    setShowAns(false)
    setAns("")
  }

  async function onKeyDown(evt: React.KeyboardEvent<HTMLDivElement>) {
    if (evt.repeat) return;
    if (evt.key.toLowerCase() === "enter") {
      if (showAns) {
        redo()
        return
      }
      setShowAns(true)
    }
  }

  useEffect(function() {
    (async function() {
      setSentence(await getSentence(await getVerbs()))
    })()
  }, [])

  return (
    <div className="m-6" onKeyDown={onKeyDown}>
      <div>
        infinitive or subjunctive?
      </div>
      {sentence.begin &&
        <div>
          {sentence.asking}
          <br/>
          {sentence.negate2nd ? <b>negation</b> : <span><b>no</b> negation</span>}
          <br/>
          {sentence.begin}
          <input className={"border-b-2 border-black focus:outline-none"} value={ans} onChange={function(it) {
            setAns(it.target.value)
          }}/>
          <br/>
        </div>
      }
      {!sentence.begin &&
        loading
      }
      {showAns && <div className={"-ml-6 pl-6"} style={{backgroundColor: ((trim(sentence.expected) === trim(ans)) ? "#90EE90" : "#FFCCCB")}}>{`got ${trim(ans)}, expected ${trim(sentence.expected)}`}</div>}
      {showAns &&
          <button onClick={async function() {
            if (showAns) {
              redo()
            }
            }}>go again!
          </button>
      }
    </div>
  );
}

export default App;
