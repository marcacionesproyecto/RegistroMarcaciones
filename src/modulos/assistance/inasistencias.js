const moment = require('moment-timezone');
const cron = require('node-cron');
const express = require('express');
const db = require('../../DB/mysql'); 
const TABLA = 'asistencias';
const tabla2 = 'usuarios';
const TABLACRON = 'horariocron';
moment.tz.setDefault('America/Lima');

async function registrarFaltasController() {

  let fechaInicial =  moment();
  const horaInicial = fechaInicial.format('HH');
  const min = fechaInicial.format('mm');
  const segundos = fechaInicial.format('ss');

  const horaFormateada = /* '15:17' */`${horaInicial}:${min}`;
  const [hora, minutos] = horaFormateada.split(':');
  const horaEnMinutos = parseInt(hora) * 60 + parseInt(minutos);

  //comprobar la hora
  if(horaEnMinutos >= 556 && horaEnMinutos <= 719){
    idTMarcacion = 1
  }else if (horaEnMinutos  >= 796 && horaEnMinutos <= 834){
    idTMarcacion = 2
  }else if (horaEnMinutos  >= 905 && horaEnMinutos <= 1079){
    idTMarcacion = 3
  }else if (horaEnMinutos >= 1205 && horaEnMinutos <= 1439){
    idTMarcacion = 4
  }
   
  let fecha = new Date() || '';
  try {
    const usuariosSinRegistro = await db.registrarFaltas(tabla2,TABLA, idTMarcacion);
    console.log('Resultado de la consulta:', usuariosSinRegistro);

    if (usuariosSinRegistro && usuariosSinRegistro.length > 0) {
      for (const idUsuario  of usuariosSinRegistro) {
        const registro = {
          IdUsuarios: idUsuario,
          Fecha: fecha,
          idTMarcacion: idTMarcacion,
          idValidacion: 3,
        };

        console.log('Registrando falta para el usuario Id:', idUsuario );

        const respuesta = await db.agregar(TABLA, registro);
        console.log('Falta registrada en la tabla asistencias:', respuesta);
      }

      return 'Faltas registradas correctamente01';

    } else {
      console.log('Todos los usuarios han registrado asistencia para hoy.');
    }
    return 'Faltas registradas correctamente.';

  } catch (error) {
    console.error('Error al registrar faltas:', error);
    throw error; 
  }
}


async function iniciarProgramacion() {
  function programarTarea(cronExpression) {
    cron.schedule(cronExpression, async () => {
      try {
        const mensaje = await registrarFaltasController();
        console.log(`Ejecución programada a las ${cronExpression}: ${mensaje}`);
      } catch (error) {
        console.error('Error en la ejecución programada:', error);
      }
    });
  }
  
  const tablacron = await db.todos(TABLACRON);
  const horasCron = tablacron.map((row) => {
          const hora = row.Horario.split(':'); 
          const minutos = hora[1];
          const horas = hora[0];
        
          return `${minutos} ${horas} * * *`;
        });
  console.log(horasCron);
  
  
  horasCron.forEach((cronExpression) => {
    programarTarea(cronExpression);
  });
}

iniciarProgramacion();
