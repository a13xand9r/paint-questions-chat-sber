import { ScenarioHandler } from './types';
import * as dictionary from './system.i18n'
import { questions } from './questionsDataBase';
import { getRandomFromArray } from './utils/utils';
const stringSimilarity = require("string-similarity");
require('dotenv').config()

const continueArr = ['Продолжим?', 'Продолжим игру?', 'Играем дальше?']

export const runAppHandler: ScenarioHandler = ({ req, res, session }, dispatch) => {
    session.questionIndex = 0
    dispatch && dispatch(['Hello'])
}

export const helloHandler: ScenarioHandler = ({ req, res }) => {
    const keyset = req.i18n(dictionary)
    const responseText = keyset('Привет')
    res.appendBubble(responseText)
    res.setPronounceText(responseText)
    res.appendSuggestions(['Да', 'Нет'])
}

export const noMatchHandler: ScenarioHandler = async ({ req, res }) => {
    const keyset = req.i18n(dictionary)
    const responseText = keyset('404')
    res.appendBubble(responseText)
    res.setPronounceText(responseText)
}

export const questionHandler: ScenarioHandler = async ({ res, session }) => {
    console.log(session.questionIndex)
    if (session.questionIndex !== undefined && session.questionIndex < questions.length){
        session.currentQuestion = questions[session.questionIndex ?? 0]

        res.appendBubble(session.currentQuestion.question)
        res.setPronounceText(session.currentQuestion.question)
    } else{
        res.appendBubble('Вопросы закончились')
    }
    res.setAutoListening(true)
}

export const wrongAnswerHandler: ScenarioHandler = async ({req, res}) => {
    const keyset = req.i18n(dictionary)
    const responseText = keyset('wrong')
    res.appendBubble(responseText)
    res.setPronounceText(responseText)
    res.appendSuggestions(['Да', 'Нет'])
    res.setAutoListening(true)
}

export const assistantRightAnswerHandler: ScenarioHandler = async ({req, res, session}, dispatch) => {
    const keyset = req.i18n(dictionary)

    const responseText = `На самом деле получится ${session.currentQuestion?.answer} цвет`

    if (session.questionIndex !== undefined && questions.length - 1 > session.questionIndex){
        session.questionIndex = session.questionIndex as number + 1

        const continueText = getRandomFromArray(continueArr)

        res.appendBubble(`${responseText}.\n${continueText}`)
        res.setPronounceText(`${responseText}. ${continueText}`)
    } else {
        res.appendBubble(`${responseText}\n${keyset('gameOver')}`)
        res.setPronounceText(`${responseText}. ${keyset('gameOver')}`)
    }
    res.appendSuggestions(['Да', 'Нет'])
    res.setAutoListening(true)


    // dispatch && dispatch(['Question'])
}

export const rightAnswerHandler: ScenarioHandler = async ({req, res, session}, dispatch) => {
    const keyset = req.i18n(dictionary)

    let responseText = keyset('right', {
        color: session.currentQuestion?.answer
    })

    if (session.questionIndex !== undefined && questions.length - 1 > session.questionIndex){
        const continueText = getRandomFromArray(continueArr)
        let additionalText = ''
        switch (session.questionIndex) {
            case 1:
                additionalText = keyset('praise1')
                break;
            case 2:
                additionalText = keyset('praise2')
                break;
            case 3:
                additionalText = ' Теперь вопрос будет посложнее.'
                break;
            default:
                break;
        }
        res.appendBubble(`${responseText}${additionalText}\n${continueText}`)
        res.setPronounceText(`${responseText}${additionalText}. ${continueText}`)

        session.questionIndex = session.questionIndex as number + 1
    } else {
        const gameOverText = keyset('gameOver')
        res.appendBubble(`${responseText}\n${gameOverText}`)
        res.setPronounceText(`${responseText}. ${gameOverText}`)
    }
    res.appendSuggestions(['Да', 'Нет'])
    res.setAutoListening(true)

}

export const answerHandler: ScenarioHandler = async ({ req, res, session }, dispatch) => {
    const userAnswer = req.message.original_text.replace('цвет', '')
    const similarity = stringSimilarity.compareTwoStrings(userAnswer, session.currentQuestion?.answer)

    if (similarity >= 0.5){
        dispatch && dispatch(['RightAnswer'])
    } else {
        dispatch && dispatch(['WrongAnswer'])
    }
}