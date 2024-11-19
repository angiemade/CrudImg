import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [imageList, setImageList] = useState([]);
  const [ListaActualizada, setListaActualizada] = useState(false);

  // MOSTRAR IMÁGENES
  useEffect(() => {
    fetch('http://localhost:3001/images/get')
      .then(res => res.json())
      .then(res => {
        console.log('Imagenes recibidas:', res); // Depuración para ver qué imágenes se reciben
        setImageList(res);
        setListaActualizada(false);
      })
      .catch(err => {
        console.error('Error al obtener las imágenes:', err);
      });
  }, [ListaActualizada]);

  // AGREGAR IMAGEN
  const selectedHandler = e => {
    setFile(e.target.files[0]);
  };

  const sendHandler = () => {
    if (!file) {
      alert('Debes subir un archivo');
      return;
    }

    const formdata = new FormData();
    formdata.append('image', file);

    fetch('http://localhost:3001/images/post', {
      method: 'POST',
      body: formdata
    })
      .then(res => res.text())
      .then(res => {
        console.log('Respuesta al subir imagen:', res);
        setListaActualizada(true);
      })
      .catch(err => {
        console.error('Error al subir la imagen:', err);
      });

    document.getElementById('fileinput').value = null;
    setFile(null);
  };

  // ELIMINAR IMAGEN
  const deleteHandler = (imageName) => {
    Swal.fire({
      title: "Eliminar",
      html: `¿Desea eliminar la imagen <strong>${imageName}</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar',
    }).then((result) => {
      if (result.isConfirmed) {
        Axios.delete(`http://localhost:3001/images/delete/${imageName.split('-')[0]}`)
          .then(() => {
            setListaActualizada(true);
            Swal.fire({
              title: `${imageName} fue eliminado`,
              icon: 'success',
              timer: 3000
            });
          })
          .catch(function (error) {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "No se logró eliminar la imagen",
              footer: JSON.parse(JSON.stringify(error)).message === "Network Error" ? "Intente más tarde" : JSON.parse(JSON.stringify(error)).message,
            });
          });
      }
    });
  };

  return (
    <>
      <nav className="navbar navbar-dark bg-dark">
        <div className="container">
          <a href="#!" className="navbar-brand">Image App</a>
        </div>
      </nav>

      <div className="container mt-5">
        <div className="card p-3">
          <div className="row">
            <div className="col-10">
              <input id="fileinput" onChange={selectedHandler} className="form-control" type="file" />
            </div>
            <div className="col-2">
              <button onClick={sendHandler} type="button" className="btn btn-primary col-12">Upload</button>
            </div>
          </div>
        </div>
      </div>
      <div className="container mt-5">
        <div className="row">
          {imageList.length === 0 ? (
            <p>No hay imágenes disponibles</p>
          ) : (
            imageList.map((image, index) => (
              <div key={index} className="col-md-3 mb-4">
                <div className="card">
                  <img className='card-img-top' style={{ height: '200px', width: '100%' }} src={`http://localhost:3001/dbimages/${image}`} alt="foto producto" onError={(e) => { e.target.onerror = null; e.target.src = 'placeholder.png'; }} />
                  <button type="button" onClick={() => deleteHandler(image)} className="btn btn-danger mt-2">Eliminar</button>                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default App;