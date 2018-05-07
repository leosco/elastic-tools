import Chance from 'chance';

const chance = new Chance();

// Given a string length (default of 17) return a random _id friendly string.
export default (length = 17) => chance.string({ length });
