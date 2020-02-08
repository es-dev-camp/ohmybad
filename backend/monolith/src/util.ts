const idGenerator = (length: number) => {
  return randomString('0123456789', length);
};

const randomString = (choices: string, len: number): string => {
  const cl: number = choices.length;
  let result = '';
  for (let i = 0; i < len; i++) {
    result += choices[Math.floor(Math.random() * cl)];
  }
  return result;
};


export { idGenerator };
