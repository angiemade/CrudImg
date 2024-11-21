import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Axios from 'axios';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

function App() {
  const [file, setFile] = useState(null);
  const [imageList, setImageList] = useState([]);
  const [ListaActualizada, setListaActualizada] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [cropper, setCropper] = useState(null);
  const [editingImageId, setEditingImageId] = useState(null);
  const [editingImagePreview, setEditingImagePreview] = useState(null);

  // MOSTRAR IMÁGENES
  useEffect(() => {
    fetch('http://localhost:3001/images/get')
      .then(res => res.json())
      .then(res => {
        console.log('Imagenes recibidas:', res);
        setImageList(res);
        setListaActualizada(false);
      })
      .catch(err => {
        console.error('Error al obtener las imágenes:', err);
      });
  }, [ListaActualizada]);

  // SELECCIONAR Y PREVISUALIZAR IMAGEN
  const selectedHandler = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result); // Previsualizar la imagen
        setFile(file); // Guardar el archivo para subirlo posteriormente
      };
      reader.readAsDataURL(file);
    }
  };

  // SUBIR NUEVA IMAGEN
  const sendHandler = () => {
    if (!cropper) {
      alert('Debes seleccionar y ajustar una imagen antes de subirla');
      return;
    }

    cropper.getCroppedCanvas().toBlob(blob => {
      const formdata = new FormData();
      formdata.append('image', blob, file.name);

      fetch('http://localhost:3001/images/post', {
        method: 'POST',
        body: formdata
      })
        .then(res => res.text())
        .then(res => {
          console.log('Respuesta al subir imagen:', res);
          setListaActualizada(true);
          setImagePreview(null); // Limpiar previsualización
          setFile(null);
          setCropper(null);
        })
        .catch(err => {
          console.error('Error al subir la imagen:', err);
        });
    });
  };

  // CANCELAR NUEVA IMAGEN
  const cancelAddHandler = () => {
    setImagePreview(null);
    setFile(null);
    setCropper(null);
  };

  // EDITAR IMAGEN
  const editHandler = (imageName) => {
    const imageId = imageName.split('-')[0]; // Extraer el ID de la imagen
    setEditingImageId(imageId);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setEditingImagePreview(reader.result); // Mostrar la imagen en el recuadro
          setFile(file); // Guardar el archivo para subirlo posteriormente
        };
        reader.readAsDataURL(file);
      }
    };

    // Simular clic para abrir el selector de archivos
    input.click();
  };

  // CANCELAR EDICIÓN
  const cancelEditHandler = () => {
    setEditingImageId(null);
    setEditingImagePreview(null);
    setFile(null);
    setCropper(null);
  };

  // GUARDAR CAMBIOS EN IMAGEN EDITADA
  const saveEditHandler = () => {
    if (!cropper || !editingImageId) {
      alert('Debes seleccionar y ajustar una imagen antes de guardar los cambios');
      return;
    }

    cropper.getCroppedCanvas().toBlob(blob => {
      const formdata = new FormData();
      formdata.append('image', blob, file.name);

      fetch(`http://localhost:3001/images/edit/${editingImageId}`, {
        method: 'PUT',
        body: formdata
      })
        .then(res => res.text())
        .then(res => {
          console.log('Respuesta al editar imagen:', res);
          Swal.fire({
            title: 'Imagen actualizada!',
            icon: 'success',
            timer: 2000
          });
          setListaActualizada(true);
          setEditingImageId(null);
          setEditingImagePreview(null);
          setFile(null);
          setCropper(null);
        })
        .catch(err => {
          console.error('Error al editar la imagen:', err);
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "No se logró actualizar la imagen",
          });
        });
    });
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
        <div className="row">
          {/* Botón para agregar nueva imagen */}
          <div className="col-md-3 mb-4">
            <div
              className="card d-flex justify-content-center align-items-center"
              style={{
                height: '200px',
                backgroundColor: '#f8f9fa',
                border: '2px dashed #ced4da',
                cursor: imagePreview ? 'default' : 'pointer'
              }}
              onClick={() => !imagePreview && document.getElementById('fileinput').click()}
            >
              {imagePreview ? (
                <>
                  <Cropper
                    src={imagePreview}
                    style={{ height: 200, width: '100%' }}
                    aspectRatio={1}
                    guides={false}
                    viewMode={1}
                    scalable={true}
                    zoomable={true}
                    cropBoxMovable={true}
                    cropBoxResizable={true}
                    onInitialized={(instance) => setCropper(instance)}
                  />
                  <button
                    type="button"
                    onClick={sendHandler}
                    className="btn btn-primary mt-2"
                  >
                    Subir Imagen
                  </button>
                  <button
                    type="button"
                    onClick={cancelAddHandler}
                    className="btn btn-secondary mt-2"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <i
                  className="bi bi-pencil"
                  style={{ fontSize: '2rem', color: '#6c757d' }}
                ></i>
              )}
              <input
                id="fileinput"
                type="file"
                style={{ display: 'none' }}
                accept="image/*"
                onChange={selectedHandler}
              />
            </div>
          </div>

          {/* Mostrar imágenes existentes */}
          {imageList.map((image, index) => {
            const imageId = image.split('-')[0];
            return (
              <div key={index} className="col-md-3 mb-4">
                <div className="card">
                  {editingImageId === imageId && editingImagePreview ? (
                    <>
                      <Cropper
                        src={editingImagePreview}
                        style={{ height: 200, width: '100%' }}
                        aspectRatio={1}
                        guides={false}
                        viewMode={1}
                        scalable={true}
                        zoomable={true}
                        cropBoxMovable={true}
                        cropBoxResizable={true}
                        onInitialized={(instance) => setCropper(instance)}
                      />
                      <button
                        type="button"
                        onClick={saveEditHandler}
                        className="btn btn-success mt-2"
                      >
                        Guardar Cambios
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditHandler}
                        className="btn btn-secondary mt-2"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <img
                        className="card-img-top"
                        style={{ height: '200px', width: '100%' }}
                        src={`http://localhost:3001/dbimages/${image}?t=${Date.now()}`}
                        alt="foto producto"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'placeholder.png';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => deleteHandler(image)}
                        className="btn btn-danger mt-2"
                      >
                        Eliminar
                      </button>
                      <button
                        type="button"
                        onClick={() => editHandler(image)}
                        className="btn btn-warning mt-2"
                      >
                        Editar
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default App;
