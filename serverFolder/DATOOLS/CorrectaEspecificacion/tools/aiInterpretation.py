import openai
import os
from dotenv import load_dotenv
load_dotenv()

def interpret_results_with_ai(test_results):
    # 1. Use your DeepSeek API key
    # Make sure this variable in your .env file holds your DeepSeek key
    deepseek_api_key = os.getenv("OPENAI_API_KEY2") 

    # 2. Point the client to the DeepSeek API endpoint
    client = openai.OpenAI(
        api_key=deepseek_api_key,
        base_url="https://api.deepseek.com" 
    )
    prompt = (
        f"You are a financial data analysis assistant. Be as concise and accurate as possible.\n\n"
        f"FIRST, classify the input below into exactly one of two categories:\n"
        f"  (A) STATISTICAL / FORECASTING — the input contains numeric time-series test results "
        f"(heteroskedasticity, stationarity, ACF/PACF, basic stats, autocorrelation, etc.) "
        f"and is aimed at building or evaluating a forecasting model.\n"
        f"  (B) NEWS / WORLD ANALYSIS — the input is a news article, headline, or narrative text "
        f"that must be interpreted for its meaning, drivers, and real-world relevance.\n\n"
        f"If the input mixes both, choose the category that dominates and note the other briefly.\n\n"
        f"INPUT:\n{test_results}\n\n"
        f"---\n\n"
        f"THEN respond according to the category.\n\n"
        f"If (A) STATISTICAL / FORECASTING:\n"
        
        f"  - Report each test outcome: Heteroskedasticity, Stationarity, Basic Stats, ACF, PACF.\n"
        f"  - State the implied best forecasting method for this series.\n"
        f"  - Provide SHORT / MEDIUM / LONG-term forecasting implications.\n"
        f"  - Give crisp recommendations (models, transformations, caveats).\n\n"
        f"If (B) NEWS / WORLD ANALYSIS:\n"
        
        f"  - Report: (1) What happened, (2) Key actors/entities, (3) Underlying drivers/causes,\n"
        f"    (4) Market / economic implications if any, (5) Geopolitical or world-relative significance,\n"
        f"    (6) SHORT / MEDIUM / LONG-term outlook.\n"
        f"  - Flag uncertainty or missing context explicitly \n\n"
        f"---\n\n"
        f"Output format:\n"
        f"  CATEGORY: A or B\n"
        f"  Then IN A FORM OF A READABLE HUMANIZED TEXT TO UNDERSTAND WHATS GOING ON IN THE WORLD AND HOW DOES THAT AFFECT WHAT PRECISELY AND HOW..\n\n"
        f"Write in clear, simple language for an expert audience. Do not waste tokens on transitions."
    )

    # 3. Call the DeepSeek model
    response = client.chat.completions.create(
        model="deepseek-v4-pro", 
        messages=[
            {"role": "system", "content": "You are an expert financial data analyst."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=800,
        temperature=0.5,
    )

    return response.choices[0].message.content.strip()