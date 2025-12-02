const anchor = require("@coral-xyz/anchor");

module.exports = async function (provider) {
  anchor.setProvider(provider);

  const program = anchor.workspace.Savechain;

  console.log("Program ID:", program.programId.toString());
};
