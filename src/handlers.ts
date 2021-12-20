import { ScenarioHandler } from './types';
import * as dictionary from './system.i18n'
import { questions } from './questionsDataBase';
const stringSimilarity = require("string-similarity");
require('dotenv').config()


export const runAppHandler: ScenarioHandler = ({ req, res, session }) => {
    const keyset = req.i18n(dictionary)
    const responseText = keyset('Привет')
    res.appendBubble(responseText)
    res.setPronounceText(responseText)

    session.questionIndex = 0
}

export const noMatchHandler: ScenarioHandler = async ({ req, res }) => {
    const keyset = req.i18n(dictionary)
    const responseText = keyset('404')
    res.appendBubble(responseText)
    res.setPronounceText(responseText)
}

export const questionHandler: ScenarioHandler = async ({ req, res, session }) => {
    if (session.questionIndex && session.questionIndex < questions.length){
        session.currentQuestion = questions[session.questionIndex ?? 0]

        res.appendBubble(session.currentQuestion.question)
        res.setPronounceText(session.currentQuestion.question)
    }
    res.appendBubble('Вопросы закончились')
}

export const wrongAnswerHandler: ScenarioHandler = async ({req, res}) => {
    const keyset = req.i18n(dictionary)
    const responseText = keyset('wrong')
    res.appendBubble(responseText)
    res.setPronounceText(responseText)
    res.appendSuggestions(['Да', 'Нет'])
}

export const assistantRightAnswerHandler: ScenarioHandler = async ({req, res, session}, dispatch) => {
    const keyset = req.i18n(dictionary)

    res.appendBubble(`На самом деле получится ${session.currentQuestion?.answer} цвет.\nПродолжим?`)
    res.setPronounceText(`На самом деле получится ${session.currentQuestion?.answer} цвет. Продолжим?`)

    session.questionIndex = session.questionIndex as number + 1

    // dispatch && dispatch(['Question'])
}

export const rightAnswerHandler: ScenarioHandler = async ({req, res, session}, dispatch) => {
    const keyset = req.i18n(dictionary)

    res.appendBubble(`Абсолютно верно.\nПродолжим?`)
    res.setPronounceText(`Абсолютно верно. Продолжим?`)

    session.questionIndex = session.questionIndex as number + 1
}

export const answerHandler: ScenarioHandler = async ({ req, res, session }, dispatch) => {
    console.log('original_text', req.message.original_text)
    console.log('human_normalized_text', req.message.human_normalized_text)
    console.log('normalized_text', req.message.normalized_text)
    const similarity = stringSimilarity.compareTwoStrings(req.message.original_text, session.currentQuestion?.answer)

    if (similarity >= 0.5){
        dispatch && dispatch(['RightAnswer'])
    } else {
        dispatch && dispatch(['WrongAnswer'])
    }
}