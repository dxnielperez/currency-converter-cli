#!/usr/bin/env node

import axios from "axios";
import inquirer from "inquirer";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/`;

const getExchangeRate = async (from, to) => {
  try {
    const response = await axios.get(`${API_URL}${from}`);

    if (response.data.result !== "success") {
      console.log(chalk.red("Error from API:", response.data.error.type));
      return null;
    }

    const rate = response.data.conversion_rates[to];

    if (!rate) {
      console.log(chalk.red("Invalid currency code. Try again."));
      return null;
    }

    return rate;
  } catch (error) {
    if (error.response) {
      console.log(
        chalk.red(
          "Error fetching exchange rate: Response data:",
          error.response.data
        )
      );
      console.log(chalk.red("Error status:", error.response.status));
    } else {
      console.log(chalk.red("Error fetching exchange rate:", error.message));
    }
    return null;
  }
};

const getSupportedCurrencies = async () => {
  try {
    const response = await axios.get(`${API_URL}USD`);
    if (response.data.result === "success") {
      return Object.keys(response.data.conversion_rates);
    } else {
      console.log(chalk.red("Error fetching supported currencies"));
      return [];
    }
  } catch (error) {
    console.log(
      chalk.red("Error fetching supported currencies:", error.message)
    );
    return [];
  }
};

const main = async () => {
  console.log(chalk.green.bold("\n Currency Converter CLI \n"));

  const supportedCurrencies = await getSupportedCurrencies();

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "fromCurrency",
      message: "Enter base currency (e.g., USD, EUR, GBP):",
      validate: (input) => {
        if (
          input.length === 3 &&
          supportedCurrencies.includes(input.toUpperCase())
        ) {
          return true;
        }
        return "Please enter a valid 3-letter currency code.";
      },
    },
    {
      type: "input",
      name: "toCurrency",
      message: "Enter target currency (e.g., USD, EUR, GBP):",
      validate: (input) => {
        if (
          input.length === 3 &&
          supportedCurrencies.includes(input.toUpperCase())
        ) {
          return true;
        }
        return "Please enter a valid 3-letter currency code.";
      },
    },
    {
      type: "input",
      name: "amount",
      message: "Enter amount to convert:",
      validate: (input) =>
        (!isNaN(input) && input > 0) || "Please enter a valid amount.",
    },
  ]);

  const { fromCurrency, toCurrency, amount } = answers;
  const rate = await getExchangeRate(
    fromCurrency.toUpperCase(),
    toCurrency.toUpperCase()
  );

  if (rate) {
    const convertedAmount = (amount * rate).toFixed(2);
    console.log(
      chalk.green.bold(
        `${amount} ${fromCurrency.toUpperCase()} = ${convertedAmount} ${toCurrency.toUpperCase()}\n`
      )
    );
  }
};

main();
