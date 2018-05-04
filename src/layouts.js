/**
 * Created by qhyang on 2018/1/22.
 */

const musicNote = [
                                                                                                                { coords: [12, 84, 0], l: .2 },    { coords: [36, 84, 0], l: .1 },
                                                                                                                { coords: [12, 60, 0], l: .1 },    { coords: [36, 60, 0], l: .02 },  { coords: [60, 60, 0], l: .03 },
                                                                                                                { coords: [12, 36, 0], l: 0 },      { coords: [60, 36, 0], l: 0 },
                                                                                                                { coords: [12, 12, 0], l: 0 },
                                        { coords: [-36, -12, 0], l: .11 },  { coords: [-12, -12, 0], l: .08 },   { coords: [12, -12, 0], l: 0 },
    { coords: [-60, -36, 0], l: .09 },  { coords: [-36, -36, 0], l: 0 },    { coords: [-12, -36, 0], l: 0 },    { coords: [12, -36, 0], l: 0 },
                                        { coords: [-36, -60, 0], l: 0 },    { coords: [-12, -60, 0], l: .03 }
],
    play = [
        { coords: [-36, 48, 0], l: .35 },
                { coords: [-12, 36, 0], l: .15 },
        { coords: [-36, 24, 0], l: .15 },   { coords: [12, 24, 0], l: .1 },
                { coords: [-12, 12, 0], l: .1 },   { coords: [36, 12, 0], l: 0 },
        { coords: [-36, 0, 0], l: .1 },    { coords: [12, 0, 0], l: 0 },     { coords: [60, 0, 0], l: 0 },
                { coords: [-12, -12, 0], l: 0 },  { coords: [36, -12, 0], l: 0 },
        { coords: [-36, -24, 0], l: 0 },  { coords: [12, -24, 0], l: 0 },
                { coords: [-12, -36, 0], l: 0 },
        { coords: [-36, -48, 0], l: 0 }
    ];

export { musicNote, play }
