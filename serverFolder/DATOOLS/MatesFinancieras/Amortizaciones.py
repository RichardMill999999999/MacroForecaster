import pandas as pd
from datetime import datetime, timedelta

# Datos del préstamo
monto_prestamo = 300000.00
tasa_interes_mensual = 0.18 / 12
num_pagos = 36

# Función para calcular el pago mensual
def calcular_pago_mensual(saldo, tasa, num_pagos):
    return saldo * tasa * (1 + tasa) ** num_pagos / ((1 + tasa) ** num_pagos - 1)

# Crear la tabla de amortización
saldo_actual = monto_prestamo
pago_mensual = calcular_pago_mensual(monto_prestamo, tasa_interes_mensual, num_pagos)
tabla_amortizacion = []
for i in range(1, num_pagos + 1):
    interes = saldo_actual * tasa_interes_mensual
    pago_capital = pago_mensual - interes
    saldo_nuevo = saldo_actual - pago_capital
    fecha_pago = datetime.now() + timedelta(days=30 * i)  # Ajustar la fecha según sea necesario
    tabla_amortizacion.append([i, fecha_pago.strftime("%m/%d/%Y"), saldo_actual, interes, pago_capital, pago_mensual, 30])
    saldo_actual = saldo_nuevo

# Crear un DataFrame de pandas con la tabla de amortización
df = pd.DataFrame(tabla_amortizacion, columns=['Número de pago', 'Fecha', 'Saldo de capital', 'Pago de intereses', 'Pago de capital', 'Monto de pago', 'Plazo en días'])
print(df)
# # Guardar el DataFrame en un archivo Excel
nombre_archivo = '../../inputFiles/tabla_amortizacion.xlsx'
df.to_excel(nombre_archivo, index=False)
