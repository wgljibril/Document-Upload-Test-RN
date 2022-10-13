import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  FlatList,
  View,
  Image,
  Alert,
  Dimensions,
} from 'react-native';

const {width, height} = Dimensions.get('screen');

import * as Progress from 'react-native-progress';
import {launchImageLibrary} from 'react-native-image-picker';

const UploadFile = (fileObject, onProgressChange, onUploadSuccess, onError) => {
  // add file to form data
  const fileData = new FormData();
  fileData.append('file', fileObject);

  // configure the request
  const request = new XMLHttpRequest();
  request.open('POST', 'API_URL_HERE');
  request.setRequestHeader('Accept', 'application/json');
  request.setRequestHeader('Content-Type', 'multipart/form-data');

  // calls a function to update the progress bar
  request.upload.addEventListener('progress', event => {
    onProgressChange(event.loaded / event.total);
  });

  // when the file finished uploading
  request.addEventListener('loadend', () => {
    onUploadSuccess();
  });

  // if the user stops the upload
  request.addEventListener('abort', () => {
    console.error('You have stopped the request.');
    console.error('We should make a request to delete the file.');
  });

  // something went wrong :(
  request.addEventListener('error', error => {
    // console.error('There was an error with the request');
    onError(error);
  });

  // submit the request
  request.send(fileData);
  return request;
};

const BASE_STATE = {
  error: false,
  request: null,
  progress: 0,
  startedUpload: false,
};

class PreviewImage extends React.Component {
  state = {...BASE_STATE};

  componentDidMount() {
    console.log(this.state.startedUpload, this.props.image.fileName);

    if (!this.state.startedUpload) {
      this.setState({startedUpload: true}, this.uploadFile);
    }
  }

  uploadFile = () => {
    if (this.state.progress === 0.0) {
      console.log('uploading', this.props.image.fileName);
      // build file object for your api/endpoint
      const fileObject = {
        uri: this.props.image.uri,
        type: this.props.image.type,
        name: `${this.props.image.fileName}.${this.props.image.type}`,
      };
  
      // save the request object
      this.setState({
        request: UploadFile(
          fileObject,
          this.onProgressChange,
          this.onUploadSuccess,
          this.onError,
        ),
      });
    }
  };

  onProgressChange = percentage => {
    // set a decimal progress number like 0.34
    this.setState({
      progress: percentage,
    });
  };

  onUploadSuccess = () => {
    // reset the state
    this.setState({
      error: false,
      request: null,
    });
  };

  onError = error => {
    // console.log('err', this.props.image.fileName)
    this.setState({
      error: true,
      progress: 0.0,
    });
  };

  deleteImage = () => {
    // stop the request
    if (this.state.request) {
      this.state.request.abort();
    }

    // remove the file from view or display confirmation message
    this.props.removeFile(this.props.image.fileName);
  };

  render() {
    const displayProgress = this.state.progress < 1 && !this.state.error;
    const displayError = this.state.error;
    const hideImage = displayProgress || displayError;

    // console.log(this.state.error, this.state.uploading, this.state.finished);

    return (
      <View style={styles.galleryItem}>
        <Image
          style={[
            hideImage && styles.inProgressImage,
            styles.galleryIamge,
          ]}
          source={{uri: this.props.image.uri}}
        />

        {displayProgress && (
          <Progress.Bar
            progress={this.state.progress}
            style={styles.progressBar}
            height={10}
            borderWidth={0}
            width={width * 0.25}
            color="green"
            unfilledColor="lightgrey"
          />
        )}

        <TouchableOpacity style={styles.deleteBtn} onPress={this.deleteImage}>
          <Text style={styles.deleteText}>x</Text>
        </TouchableOpacity>

        {this.state.error && <Text>Failed to upload</Text>}
      </View>
    );
  }
}

const App = () => {
  const [images, setImages] = useState([]);

  const openLibrary = () => {
    launchImageLibrary(
      {
        mediaType: 'mixed',
      },
      res => {
        if (res.errorCode || res.errorMessage) {
          Alert.alert('Oops!', 'Could not select an image');
          return;
        }

        setImages(images.concat(res.assets));
      });
  };

  const removeFile = fileName => {
    setImages(prevState => {
      return prevState.filter(item => item.fileName !== fileName);
    });
  };

  const fileKey = (item, index) => {
    return item.fileName + index;
  };

  const renderImage = (item) => {
    return (
      <PreviewImage
        image={item.item}
        removeFile={removeFile}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerLabel}>Select a photo here...</Text>

      <TouchableOpacity style={styles.openLibraryBtn} onPress={openLibrary}>
        <Text>Open photo library</Text>
      </TouchableOpacity>

      <FlatList
        contentContainerStyle={styles.gallery}
        data={images}
        numColumns={3}
        keyExtractor={fileKey}
        renderItem={renderImage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  headerLabel: {
    fontSize: 30,
    marginTop: 30,
    fontWeight: 'bold',
    alignSelf: 'center',
  },

  openLibraryBtn: {
    height: 50,
    width: '80%',
    marginTop: 30,
    borderRadius: 10,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'lightblue',
  },

  gallery: {
    marginTop: 30,
    paddingLeft: 3.5,
  },

  galleryItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryIamge: {
    height: 100,
    width: width * 0.3,
    marginVertical: 5,
    marginHorizontal: 5,
  },

  inProgressImage: {
    opacity: 0.5,
  },
  progressBar: {
    top: '50%',
    position: 'absolute',
  },

  deleteBtn: {
    top: 0,
    right: -2.5,
    borderRadius: 20,
    position: 'absolute',
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    backgroundColor: 'lightgrey',
  },
  deleteText: {
    color: 'red',
  },
});

export default App;
