const MAX_POSSIBLE_CHEQUE_PAYMENT: f64 = 25_000_000.00;

static ONES: [&str; 10] = [
    "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"
];
static TEENS: [&str; 10] = [
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", 
    "Seventeen", "Eighteen", "Nineteen"
];
static TENS: [&str; 10] = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];
static THOUSANDS: [&str; 3] = [
    "", "Thousand", "Million",
];


fn chunk_to_words(n: u64) -> String {
    match n {
        0..=9 => ONES[n as usize].to_string(),
        10..=19 => TEENS[n as usize - 10].to_string(),
        20..=99 => {
            if n % 10 == 0 {
                TENS[n as usize / 10].to_string()
            } else {
                format!("{}-{}", TENS[n as usize / 10], ONES[n as usize % 10])
            }
        }
        100..=999 => {
            if n % 100 == 0 {
                format!("{} hundred", ONES[n as usize / 100])
            } else {
                format!("{} hundred and {}", ONES[n as usize / 100], chunk_to_words(n % 100))
            }
        }
        _ => unreachable!(),
    }
}


fn number_to_words(n: u64) -> String {
    if n == 0 {
        return "zero".to_string();
    }
    let mut words: Vec<String> = vec![];
    let mut number: u64 = n;
    let mut index: usize = 0;

    while number > 0 {
        if number % 1000 != 0 {
            words.insert(0, format!(
                "{} {}",
                chunk_to_words(number % 1000),
                THOUSANDS[index]
            ).trim().to_string());
        }
        number /= 1000;
        index += 1;
    }
    words.join(" ")
}


#[tauri::command]
pub fn cheque_to_text(amount: f64, name: &str) -> Result<String, String> {
    if amount > MAX_POSSIBLE_CHEQUE_PAYMENT {
        return Err("Amount exceeds the limit of 25 million.".to_string());
    }
    if amount < 0.0 {
        return Err("Negative amounts are not allowed.".to_string());
    }
    if amount.is_infinite() {
        return Err("Amount cannot be infinite.".to_string());
    }
    if amount.is_nan() {
        return Err("Amount is not a number.".to_string());
    }
    let rounded_amount = (amount * 100.0).round() / 100.0;
    if (amount - rounded_amount).abs() > f64::EPSILON {
        return Err("Amount has more than two decimal places.".to_string());
    } 
    let whole: u64 = amount as u64;
    let fractional: u64 = ((amount - whole as f64) * 100.0).round() as u64;

    let words: String = number_to_words(whole);
    let cents: String = number_to_words(fractional);

    let dollar_word: &str = if whole == 1 { "Dollar" } else { "Dollars" };
    let cent_word: &str = if fractional == 1 { "Cent" } else { "Cents" };

    Ok(format!("Payee: {}\nAmount: {} {} and {} {}", name, words, dollar_word, cents, cent_word))
}


