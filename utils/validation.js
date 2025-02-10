const userValidator = {
  email: email => {
    const isValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
      email,
    );
    return {
      isValid,
      message: !email
        ? '이메일을 입력해주세요.'
        : !isValid
          ? '올바른 이메일 형식이 아닙니다. (예:example@example.com)'
          : null,
    };
  },

  password: password => {
    const isValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.~_-])[A-Za-z\d@$!%*?&#.~_-]{8,20}$/.test(
        password,
      );
    return {
      isValid,
      message: !password
        ? '비밀번호를 입력해주세요.'
        : !isValid
          ? '비밀번호는 8-20자의 대소문자, 숫자, 특수문자를 포함해야 합니다.'
          : null,
    };
  },

  nickname: nickname => {
    const isValid = /^[^\s]{1,10}$/.test(nickname);
    return {
      isValid,
      message: !nickname
        ? '닉네임을 입력해주세요.'
        : !isValid
          ? '닉네임은 공백 없이 1-10자여야 합니다.'
          : null,
    };
  },
  
  image: (file, imagePath) => {
    // 신규 업로드 파일 검증
    if (file) {
      if (!file.mimetype.startsWith('image/')) {
        return {
          isValid: false,
          message: '이미지 파일만 업로드 가능합니다.'
        };
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return {
          isValid: false,
          message: '이미지 크기는 5MB 이하여야 합니다.'
        };
      }

      return {
        isValid: true,
        message: null
      };
    }

    // 기본 프로필 이미지 경로인 경우
    if (imagePath === `${process.env.BASIC_PROFILE_IMAGE}`) {
      return {
        isValid: true,
        message: null
      };
    }

    // 기존 이미지 URL 검증
    if (imagePath) {
      const validDomains = [process.env.CLOUDFRONT_DOMAIN, process.env.S3_BUCKET_URL];
      const isValidDomain = validDomains.some(domain => imagePath.startsWith(domain));
      
      if (!isValidDomain) {
        return {
          isValid: false,
          message: '유효하지 않은 이미지 경로입니다.'
        };
      }

      return {
        isValid: true,
        message: null
      };
    }

    return {
      isValid: false,
      message: '프로필 이미지를 업로드해주세요.'
    };
  }
};

const postValidator = {
  title: title => {
    const trimmed = title?.trim();
    return {
      isValid: trimmed && trimmed.length > 0 && trimmed.length <= 26,
      message: !trimmed
        ? '제목을 입력해주세요.'
        : trimmed.length > 26
          ? '제목은 26자 이내로 작성해주세요.'
          : null,
    };
  },

  content: content => {
    const trimmed = content?.trim();
    return {
      isValid: trimmed && trimmed.length > 0 && trimmed.length <= 5000,
      message: !trimmed
        ? '내용을 입력해주세요.'
        : trimmed.length > 5000
          ? '내용은 5000자 이내로 작성해주세요.'
          : null,
    };
  },

  comment: comment => {
    const trimmed = comment?.trim();
    return {
      isValid: trimmed && trimmed.length > 0 && trimmed.length <= 200,
      message: !trimmed
        ? '댓글을 입력해주세요.'
        : trimmed.length > 200
          ? '댓글은 200자 이내로 작성해주세요.'
          : null,
    };
  },

  image: (file, imagePath) => {
    // 이미지가 없는 경우도 유효
    if (!file && !imagePath) return { isValid: true, message: null };
    
    // 신규 업로드 파일 검증
    if (file) {
      if (!file.mimetype.startsWith('image/')) {
        return {
          isValid: false,
          message: '이미지 파일만 업로드 가능합니다.'
        };
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return {
          isValid: false,
          message: '이미지 크기는 5MB 이하여야 합니다.'
        };
      }

      return {
        isValid: true,
        message: null
      };
    }

    // 기존 이미지 URL 검증
    if (imagePath) {
      const validDomains = [process.env.CLOUDFRONT_DOMAIN, process.env.S3_BUCKET_URL];
      const isValidDomain = validDomains.some(domain => imagePath.startsWith(domain));
      
      if (!isValidDomain) {
        return {
          isValid: false,
          message: '유효하지 않은 이미지 경로입니다.'
        };
      }

      return {
        isValid: true,
        message: null
      };
    }

    return {
      isValid: false,
      message: '프로필 이미지를 업로드해주세요.'
    };
  }
};


module.exports = {
  userValidator,
  postValidator,
};
